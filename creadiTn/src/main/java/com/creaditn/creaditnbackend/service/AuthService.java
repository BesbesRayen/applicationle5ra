package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.*;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.entity.UserWallet;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_VERIFY_ATTEMPTS  = 5;
    private static final int RESEND_COOLDOWN_SECS = 60;
    private static final int OTP_EXPIRY_MINUTES   = 5;

    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;
    private final CreadiScoreService creadiScoreService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final Map<String, ResetSession> resetSessions = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.trim();
    }

    private String normalizeIdentifier(String identifier) {
        if (identifier == null) return "";
        String value = identifier.trim();
        return value.contains("@") ? normalizeEmail(value) : normalizePhone(value);
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        if (normalizedEmail.isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new BadRequestException("Email already registered");
        }
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new BadRequestException("Password must be at least 8 characters");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .profession(request.getProfession())
                .build();

        userRepository.save(user);

        // Create initial wallet with simulation balance
        userWalletRepository.save(UserWallet.builder()
                .userId(user.getId())
                .balance(new BigDecimal("2000.00"))
                .build());

        // Auto-calculate initial Creadi Score
        try { creadiScoreService.calculateScore(user.getId()); } catch (Exception ignored) {}

        // Generate and send email verification OTP — DO NOT issue JWT yet
        String otp = generateOtp();
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        user.setEmailVerificationAttempts(0);
        user.setEmailVerificationSentAt(LocalDateTime.now());
        userRepository.save(user);
        try {
            emailService.sendEmailVerificationOtp(user.getEmail(), user.getFirstName(), otp);
        } catch (Exception ignored) {}

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .emailVerified(false)
                .message("Compte cree. Veuillez verifier votre adresse email avec le code envoye.")
                .token(null)
                .build();
    }

    /** Verify email with 6-digit OTP. Returns JWT on success. */
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Utilisateur introuvable."));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            String token = jwtUtil.generateToken(user.getId(), user.getEmail());
            return AuthResponse.builder()
                    .userId(user.getId()).email(user.getEmail())
                    .firstName(user.getFirstName()).lastName(user.getLastName())
                    .emailVerified(true).message("Email deja verifie.")
                    .token(token).build();
        }

        int attempts = user.getEmailVerificationAttempts() == null ? 0 : user.getEmailVerificationAttempts();
        if (attempts >= MAX_VERIFY_ATTEMPTS) {
            throw new BadRequestException(
                    "Trop de tentatives incorrectes. Veuillez demander un nouveau code.");
        }

        if (user.getEmailVerificationOtpExpiry() == null ||
                LocalDateTime.now().isAfter(user.getEmailVerificationOtpExpiry())) {
            throw new BadRequestException(
                    "Le code de verification a expire. Veuillez en demander un nouveau.");
        }

        if (!request.getCode().trim().equals(user.getEmailVerificationOtp())) {
            user.setEmailVerificationAttempts(attempts + 1);
            userRepository.save(user);
            int remaining = MAX_VERIFY_ATTEMPTS - (attempts + 1);
            throw new BadRequestException(
                    "Code incorrect. " + (remaining > 0 ? remaining + " tentative(s) restante(s)." : "Limite atteinte."));
        }

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        user.setEmailVerificationOtp(null);
        user.setEmailVerificationOtpExpiry(null);
        user.setEmailVerificationAttempts(0);
        userRepository.save(user);

        try { emailService.sendWelcome(user.getEmail(), user.getFirstName()); } catch (Exception ignored) {}

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .userId(user.getId()).email(user.getEmail())
                .firstName(user.getFirstName()).lastName(user.getLastName())
                .emailVerified(true)
                .message("Email verifie. Bienvenue sur CreadiTN !")
                .token(token).build();
    }

    /** Resend verification OTP with 60-second cooldown. */
    public ApiResponse resendVerification(ResendVerificationRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Utilisateur introuvable."));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Cet email est deja verifie.");
        }

        if (user.getEmailVerificationSentAt() != null &&
                LocalDateTime.now().isBefore(user.getEmailVerificationSentAt().plusSeconds(RESEND_COOLDOWN_SECS))) {
            long secondsLeft = java.time.Duration.between(
                    LocalDateTime.now(), user.getEmailVerificationSentAt().plusSeconds(RESEND_COOLDOWN_SECS))
                    .getSeconds();
            throw new BadRequestException(
                    "Veuillez patienter " + secondsLeft + " seconde(s) avant de renvoyer le code.");
        }

        String otp = generateOtp();
        user.setEmailVerificationOtp(otp);
        user.setEmailVerificationOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        user.setEmailVerificationAttempts(0);
        user.setEmailVerificationSentAt(LocalDateTime.now());
        userRepository.save(user);

        try {
            emailService.sendEmailVerificationOtp(user.getEmail(), user.getFirstName(), otp);
        } catch (Exception ignored) {}

        return ApiResponse.success("Nouveau code de verification envoye a votre adresse email.");
    }

    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadRequestException("Email ou mot de passe incorrect"));

        boolean valid;
        if (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$")) {
            valid = passwordEncoder.matches(request.getPassword(), user.getPassword());
        } else {
            valid = user.getPassword().equals(request.getPassword());
            if (valid) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            }
        }

        if (!valid) {
            throw new BadRequestException("Email ou mot de passe incorrect");
        }

        if (Boolean.TRUE.equals(user.getAccountDeleted())) {
            throw new BadRequestException("Ce compte a ete supprime. Contactez le support.");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException(
                    "EMAIL_NOT_VERIFIED: Veuillez verifier votre adresse email avant de vous connecter.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .emailVerified(true)
                .message("Connexion reussie")
                .token(token)
                .build();
    }

    public ApiResponse requestPasswordReset(ForgotPasswordRequest request) {
        String identifier = normalizeIdentifier(request.getIdentifier());
        if (identifier.isBlank()) {
            throw new BadRequestException("Email ou numero de telephone requis");
        }

        User user = findByIdentifier(identifier);
        String code = generateOtp();
        resetSessions.put(identifier, new ResetSession(user.getId(), code, LocalDateTime.now().plusMinutes(10)));

        if (identifier.contains("@")) {
            try { emailService.sendOtp(user.getEmail(), user.getFirstName(), code); } catch (Exception ignored) {}
        }

        return ApiResponse.success("Un code de verification a ete envoye a votre " +
                (identifier.contains("@") ? "email" : "numero de telephone") + ".");
    }

    public ApiResponse confirmPasswordReset(ForgotPasswordConfirmRequest request) {
        String identifier = normalizeIdentifier(request.getIdentifier());
        ResetSession session = resetSessions.get(identifier);
        if (session == null) {
            throw new BadRequestException("Aucune demande de reinitialisation trouvee. Recommencez.");
        }
        if (LocalDateTime.now().isAfter(session.expiresAt())) {
            resetSessions.remove(identifier);
            throw new BadRequestException("Code expire. Veuillez demander un nouveau code.");
        }
        if (!session.code().equals(request.getCode().trim())) {
            throw new BadRequestException("Code de verification incorrect.");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new BadRequestException("Le nouveau mot de passe doit contenir au moins 8 caracteres.");
        }

        User user = userRepository.findById(session.userId())
                .orElseThrow(() -> new BadRequestException("Utilisateur introuvable"));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        resetSessions.remove(identifier);

        try { emailService.sendPasswordChanged(user.getEmail(), user.getFirstName()); } catch (Exception ignored) {}

        return ApiResponse.success("Mot de passe reinitialise avec succes.");
    }

    public AuthResponse googleLogin(GoogleAuthRequest request) {
        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            throw new BadRequestException("Token Google invalide");
        }
        User user = userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new BadRequestException("Aucun utilisateur - inscrivez-vous d'abord"));
        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .userId(user.getId()).email(user.getEmail())
                .firstName(user.getFirstName()).lastName(user.getLastName())
                .message("Connexion Google (demo)").token(token)
                .build();
    }

    private User findByIdentifier(String identifier) {
        if (identifier.contains("@")) {
            return userRepository.findByEmailIgnoreCase(identifier)
                    .orElseThrow(() -> new BadRequestException("Aucun compte trouve avec cet email."));
        }
        return userRepository.findByPhone(identifier)
                .orElseThrow(() -> new BadRequestException("Aucun compte trouve avec ce numero."));
    }

    private record ResetSession(Long userId, String code, LocalDateTime expiresAt) {}

    private String generateOtp() {
        return String.valueOf(100000 + secureRandom.nextInt(900000));
    }
}