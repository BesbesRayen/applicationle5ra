package com.creaditn.creaditnbackend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@creaditn.tn}")
    private String from;

    // â”€â”€â”€ Core HTML send â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public void send(String to, String subject, String htmlBody) {
        if (to == null || to.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (Exception ex) {
            log.warn("Could not send email to {}: {}", to, ex.getMessage());
        }
    }

    // â”€â”€â”€ Welcome email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public void sendWelcome(String to, String firstName) {
        String subject = "Bienvenue sur CreadiTN ðŸŽ‰";
        String body = html(
            "Bienvenue, " + firstName + " !",
            "Votre compte <strong>CreadiTN</strong> a Ã©tÃ© crÃ©Ã© avec succÃ¨s.",
            "Vous pouvez maintenant demander du crÃ©dit, suivre vos Ã©chÃ©ances et gÃ©rer vos paiements facilement.",
            null, null
        );
        send(to, subject, body);
    }

    // â”€â”€â”€ OTP reset email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public void sendOtp(String to, String firstName, String code) {
        String subject = "Votre code de vÃ©rification CreadiTN";
        String body = html(
            "RÃ©initialisation du mot de passe",
            "Bonjour <strong>" + firstName + "</strong>,",
            "Utilisez le code ci-dessous pour rÃ©initialiser votre mot de passe. " +
            "Ce code est valide pendant <strong>10 minutes</strong>.",
            code,
            "Si vous n'Ãªtes pas Ã  l'origine de cette demande, ignorez cet email."
        );
        send(to, subject, body);
    }

    // â”€â”€â”€ Password changed confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public void sendPasswordChanged(String to, String firstName) {
        String subject = "Mot de passe modifiÃ© â€” CreadiTN";
        String body = html(
            "Mot de passe mis Ã  jour",
            "Bonjour <strong>" + firstName + "</strong>,",
            "Votre mot de passe CreadiTN a Ã©tÃ© modifiÃ© avec succÃ¨s.",
            null,
            "Si vous n'avez pas effectuÃ© cette modification, contactez notre support immÃ©diatement."
        );
        send(to, subject, body);
    }

    // â”€â”€â”€ Payment receipt email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // --- Email address verification OTP ---
    public void sendEmailVerificationOtp(String to, String firstName, String otp) {
        String subject = "Verifiez votre adresse email - CreadiTN";
        String body = html(
            "Verification de votre email",
            "Bonjour <strong>" + firstName + "</strong>,",
            "Entrez le code ci-dessous pour activer votre compte. Valide 5 minutes.",
            otp,
            "Si vous n'avez pas cree de compte CreadiTN, ignorez cet email."
        );
        send(to, subject, body);
    }
    public void sendPaymentConfirmation(String to, String firstName, String ref, String amount) {
        String subject = "Paiement confirmÃ© â€” CreadiTN";
        String body = html(
            "Paiement confirmÃ© âœ“",
            "Bonjour <strong>" + firstName + "</strong>,",
            "Votre paiement de <strong>" + amount + " DT</strong> a Ã©tÃ© traitÃ© avec succÃ¨s.",
            ref,
            "RÃ©fÃ©rence de transaction affichÃ©e ci-dessus."
        );
        send(to, subject, body);
    }

    // â”€â”€â”€ HTML template â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private String html(String title, String line1, String line2, String highlight, String footer) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='" +
                "margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;'>");
        sb.append("<div style='max-width:520px;margin:40px auto;background:#ffffff;" +
                "border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);'>");

        // Header
        sb.append("<div style='background:#1a1aff;padding:28px 32px;text-align:center;'>");
        sb.append("<h1 style='color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;'>CreadiTN</h1>");
        sb.append("<p style='color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;'>BNPL Tunisia</p>");
        sb.append("</div>");

        // Body
        sb.append("<div style='padding:32px;'>");
        sb.append("<h2 style='color:#1a1a2e;font-size:20px;margin:0 0 16px;'>").append(title).append("</h2>");
        sb.append("<p style='color:#444;font-size:15px;line-height:1.6;margin:0 0 12px;'>").append(line1).append("</p>");
        sb.append("<p style='color:#444;font-size:15px;line-height:1.6;margin:0 0 20px;'>").append(line2).append("</p>");

        if (highlight != null) {
            sb.append("<div style='background:#f0f0ff;border:2px solid #1a1aff;border-radius:10px;" +
                    "padding:20px;text-align:center;margin:20px 0;'>");
            sb.append("<span style='font-size:32px;font-weight:900;color:#1a1aff;letter-spacing:6px;'>")
              .append(highlight).append("</span>");
            sb.append("</div>");
        }

        if (footer != null) {
            sb.append("<p style='color:#888;font-size:13px;margin:20px 0 0;border-top:1px solid #eee;" +
                    "padding-top:16px;'>").append(footer).append("</p>");
        }

        sb.append("</div>");

        // Footer
        sb.append("<div style='background:#f9f9f9;padding:16px 32px;text-align:center;" +
                "border-top:1px solid #eee;'>");
        sb.append("<p style='color:#aaa;font-size:12px;margin:0;'>Â© 2026 CreadiTN Â· BNPL Tunisia Â· " +
                "<a href='mailto:support@creaditn.tn' style='color:#1a1aff;'>support@creaditn.tn</a></p>");
        sb.append("</div>");

        sb.append("</div></body></html>");
        return sb.toString();
    }
}

