package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.CreadiScoreResponse;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.CreadiScoreRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CreadiScoreService {

    private final UserRepository userRepository;
    private final CreadiScoreRepository creadiScoreRepository;
    private final InstallmentRepository installmentRepository;

    public CreadiScoreResponse calculateScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        int kycScore = computeKycScore(user);
        int salaryScore = computeSalaryScore(user);
        int maritalScore = computeMaritalScore(user);
        int childrenScore = computeChildrenScore(user);
        int behaviorScore = computeBehaviorScore(user);

        int totalScore = kycScore + salaryScore + maritalScore + childrenScore + behaviorScore;
        totalScore = Math.max(0, Math.min(1000, totalScore));

        ScoreLevel level = determineLevel(totalScore);
        RiskLevel risk = determineRisk(totalScore);
        String reason = generateReason(user, kycScore, salaryScore, totalScore);
        String badge = determineBadge(totalScore);
        double maxCreditLimit = computeCreditLimit(totalScore, user);
        List<String> tips = generateImprovementTips(user, kycScore, salaryScore, behaviorScore);

        CreadiScore entity = CreadiScore.builder()
                .user(user)
                .totalScore(totalScore)
                .kycScore(kycScore)
                .salaryScore(salaryScore)
                .maritalScore(maritalScore)
                .childrenScore(childrenScore)
                .behaviorScore(behaviorScore)
                .level(level)
                .risk(risk)
                .reason(reason)
                .badge(badge)
                .build();

        creadiScoreRepository.save(entity);

        List<CreadiScoreResponse.ScoreHistoryItem> history = getScoreHistory(userId);

        return CreadiScoreResponse.builder()
                .userId(userId)
                .score(totalScore)
                .level(level)
                .risk(risk)
                .reason(reason)
                .kycScore(kycScore)
                .salaryScore(salaryScore)
                .maritalScore(maritalScore)
                .childrenScore(childrenScore)
                .behaviorScore(behaviorScore)
                .badge(badge)
                .maxCreditLimit(maxCreditLimit)
                .history(history)
                .improvementTips(tips)
                .calculatedAt(entity.getCreatedAt())
                .build();
    }

    public CreadiScoreResponse getLatestScore(Long userId) {
        CreadiScore cs = creadiScoreRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .orElse(null);

        if (cs == null) {
            // Auto-calculate score for users who don't have one yet
            return calculateScore(userId);
        }

        User user = cs.getUser();
        double maxCreditLimit = computeCreditLimit(cs.getTotalScore(), user);
        List<String> tips = generateImprovementTips(user, cs.getKycScore(), cs.getSalaryScore(), cs.getBehaviorScore());
        List<CreadiScoreResponse.ScoreHistoryItem> history = getScoreHistory(userId);

        return CreadiScoreResponse.builder()
                .userId(userId)
                .score(cs.getTotalScore())
                .level(cs.getLevel())
                .risk(cs.getRisk())
                .reason(cs.getReason())
                .kycScore(cs.getKycScore())
                .salaryScore(cs.getSalaryScore())
                .maritalScore(cs.getMaritalScore())
                .childrenScore(cs.getChildrenScore())
                .behaviorScore(cs.getBehaviorScore())
                .badge(cs.getBadge())
                .maxCreditLimit(maxCreditLimit)
                .history(history)
                .improvementTips(tips)
                .calculatedAt(cs.getCreatedAt())
                .build();
    }

    // ── KYC SCORE (max 300) ─────────────────────────────────────
    private int computeKycScore(User user) {
        return user.getKycStatus() == KycStatus.APPROVED ? 300 : 0;
    }

    // ── SALARY SCORE (max 300) ──────────────────────────────────
    private int computeSalaryScore(User user) {
        Double salary = user.getMonthlySalary();
        if (salary == null || salary <= 0) return 0;
        if (salary >= 2000) return 300;
        if (salary >= 1000) return 200;
        if (salary >= 500) return 100;
        return 50;
    }

    // ── MARITAL STATUS SCORE (max 100) ──────────────────────────
    private int computeMaritalScore(User user) {
        String status = user.getMaritalStatus();
        if (status == null || status.isBlank()) return 50;
        return switch (status.toUpperCase()) {
            case "MARRIED", "MARIÉ", "MARIÉE" -> 100;
            case "SINGLE", "CÉLIBATAIRE" -> 50;
            case "DIVORCED", "DIVORCÉ", "DIVORCÉE", "WIDOWED", "VEUF", "VEUVE" -> 70;
            default -> 50;
        };
    }

    // ── CHILDREN SCORE (max 100) ────────────────────────────────
    private int computeChildrenScore(User user) {
        Integer children = user.getNumberOfChildren();
        if (children == null) return 100;
        if (children == 0) return 100;
        if (children <= 2) return 50;
        return 20;
    }

    // ── BEHAVIOR SCORE (max 200, can be negative penalty) ───────
    private int computeBehaviorScore(User user) {
        int score = 0;

        // Completed KYC quickly (+100)
        if (user.getKycStatus() == KycStatus.APPROVED && user.getKycSubmittedAt() != null) {
            long hoursToComplete = Duration.between(user.getCreatedAt(), user.getKycSubmittedAt()).toHours();
            if (hoursToComplete <= 48) {
                score += 100;
            } else if (hoursToComplete <= 168) {
                score += 60;
            } else {
                score += 30;
            }
        }

        // No fraud detected (+100)
        if (Boolean.FALSE.equals(user.getKycFraudFlag())) {
            score += 100;
        }

        // Multiple failed attempts (-50 penalty)
        Integer failedAttempts = user.getKycFailedAttempts();
        if (failedAttempts != null && failedAttempts >= 3) {
            score -= 50;
        }

        // Installment payment behavior impact
        int paymentModifier = user.getPaymentScoreModifier() == null ? 0 : user.getPaymentScoreModifier();
        score += paymentModifier;

        return Math.max(0, score);
    }

    // ── SCORE LEVEL ─────────────────────────────────────────────
    private ScoreLevel determineLevel(int score) {
        if (score >= 800) return ScoreLevel.EXCELLENT;
        if (score >= 600) return ScoreLevel.GOOD;
        if (score >= 400) return ScoreLevel.MEDIUM;
        return ScoreLevel.HIGH_RISK;
    }

    // ── RISK LEVEL ──────────────────────────────────────────────
    private RiskLevel determineRisk(int score) {
        if (score >= 800) return RiskLevel.LOW;
        if (score >= 600) return RiskLevel.MODERATE;
        if (score >= 400) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    // ── REASON GENERATOR ────────────────────────────────────────
    private String generateReason(User user, int kycScore, int salaryScore, int totalScore) {
        List<String> positives = new ArrayList<>();
        List<String> negatives = new ArrayList<>();

        if (kycScore == 300) {
            positives.add("verified identity");
        } else {
            negatives.add("identity not yet verified");
        }

        if (salaryScore >= 200) {
            positives.add("stable salary");
        } else if (salaryScore > 0) {
            negatives.add("salary could be improved");
        } else {
            negatives.add("no salary information provided");
        }

        if (Boolean.FALSE.equals(user.getKycFraudFlag())) {
            positives.add("clean fraud record");
        } else {
            negatives.add("fraud flag detected on account");
        }

        StringBuilder sb = new StringBuilder();
        if (totalScore >= 800) {
            sb.append("Your score is excellent");
        } else if (totalScore >= 600) {
            sb.append("Your score is good");
        } else if (totalScore >= 400) {
            sb.append("Your score needs improvement");
        } else {
            sb.append("Your score is at high risk level");
        }

        if (!positives.isEmpty()) {
            sb.append(" due to ").append(String.join(", ", positives));
        }
        if (!negatives.isEmpty()) {
            sb.append(". Consider improving: ").append(String.join(", ", negatives));
        }
        sb.append(".");

        return sb.toString();
    }

    // ── BADGE / GAMIFICATION ────────────────────────────────────
    private String determineBadge(int score) {
        if (score >= 900) return "GOLD";
        if (score >= 700) return "SILVER";
        if (score >= 500) return "BRONZE";
        return null;
    }

    // ── CREDIT LIMIT (salary + marital only, NO score blocking) ─
    private double computeCreditLimit(int score, User user) {
        return computeCreditLimitFromUser(user);
    }

    /**
     * Public method: compute credit limit directly from user salary + marital status.
     * No CreadiScore dependency.
     */
    public double computeCreditLimitForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return computeCreditLimitFromUser(user);
    }

    private double computeCreditLimitFromUser(User user) {
        Double salary = user.getMonthlySalary();
        if (salary == null || salary <= 0) return 0;

        double baseCredit;
        if (salary < 1000) baseCredit = 1000;
        else if (salary < 2000) baseCredit = 2000;
        else if (salary < 4000) baseCredit = 4000;
        else baseCredit = 6000;

        // Married bonus +10%
        String marital = user.getMaritalStatus();
        if (marital != null && !marital.isBlank()) {
            String upper = marital.toUpperCase();
            if (upper.equals("MARRIED") || upper.startsWith("MARIÉ")) {
                baseCredit *= 1.10;
            }
        }

        int modifier = user.getPaymentScoreModifier() == null ? 0 : user.getPaymentScoreModifier();
        double paymentFactor = 1.0 + (modifier / 1000.0);

        long overdueCount = installmentRepository
                .findByCreditRequestUserIdAndStatus(user.getId(), InstallmentStatus.OVERDUE)
                .size();
        long pendingCount = installmentRepository
                .findByCreditRequestUserIdAndStatus(user.getId(), InstallmentStatus.PENDING)
                .size();

        if (overdueCount > 0 && pendingCount > 0) {
            paymentFactor -= Math.min(0.25, overdueCount / (double) (pendingCount + overdueCount));
        }

        baseCredit = baseCredit * Math.max(0.6, paymentFactor);

        // BNPL guardrail for the demo flow.
        return Math.min(2000, Math.round(baseCredit));
    }

    // ── IMPROVEMENT TIPS ────────────────────────────────────────
    private List<String> generateImprovementTips(User user, int kycScore, int salaryScore, int behaviorScore) {
        List<String> tips = new ArrayList<>();

        if (kycScore < 300) {
            tips.add("Complete your KYC verification to gain up to 300 points");
        }
        if (salaryScore < 300) {
            tips.add("Update your salary information to improve your score");
        }
        if (behaviorScore < 150) {
            tips.add("Maintain a clean record with no failed verification attempts");
        }
        if (user.getMaritalStatus() == null || user.getMaritalStatus().isBlank()) {
            tips.add("Provide your marital status for a complete profile assessment");
        }
        if (user.getNumberOfChildren() == null) {
            tips.add("Add the number of dependents to complete your profile");
        }

        if (tips.isEmpty()) {
            tips.add("Great job! Maintain your current standing to keep your excellent score");
        }

        return tips;
    }

    // ── SCORE HISTORY ───────────────────────────────────────────
    private List<CreadiScoreResponse.ScoreHistoryItem> getScoreHistory(Long userId) {
        return creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(10)
                .map(cs -> CreadiScoreResponse.ScoreHistoryItem.builder()
                        .score(cs.getTotalScore())
                        .level(cs.getLevel())
                        .date(cs.getCreatedAt())
                        .build())
                .toList();
    }
}
