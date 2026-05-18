package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.RiskLevel;
import com.creaditn.creaditnbackend.entity.ScoreLevel;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreadiScoreResponse {
    private Long userId;
    private Integer score;
    private ScoreLevel level;
    private RiskLevel risk;
    private String reason;

    private Integer kycScore;
    private Integer salaryScore;
    private Integer maritalScore;
    private Integer childrenScore;
    private Integer behaviorScore;

    private String badge;
    private Double maxCreditLimit;

    private List<ScoreHistoryItem> history;
    private List<String> improvementTips;

    private LocalDateTime calculatedAt;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ScoreHistoryItem {
        private Integer score;
        private ScoreLevel level;
        private LocalDateTime date;
    }
}
