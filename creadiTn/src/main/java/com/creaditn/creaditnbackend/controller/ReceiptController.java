package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.entity.Payment;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class ReceiptController {

    private final PaymentRepository paymentRepository;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMMM yyyy HH:mm", java.util.Locale.FRENCH);

    @GetMapping("/receipt/{paymentId}")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));

        byte[] pdf = buildReceiptPdf(payment);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"receipt-" + paymentId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private byte[] buildReceiptPdf(Payment payment) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            float pageW = page.getMediaBox().getWidth();   // 595
            float pageH = page.getMediaBox().getHeight();  // 842
            float margin = 50;
            float contentW = pageW - 2 * margin;

            PDType1Font bold    = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font oblique = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {

                // ── Header background band ──────────────────────────────
                cs.setNonStrokingColor(0.11f, 0.11f, 0.95f);   // primary blue
                cs.addRect(0, pageH - 110, pageW, 110);
                cs.fill();

                // ── App name ──────────────────────────────────────────
                cs.beginText();
                cs.setFont(bold, 26);
                cs.setNonStrokingColor(1f, 1f, 1f);
                cs.newLineAtOffset(margin, pageH - 56);
                cs.showText("CreadiTN");
                cs.endText();

                // ── Sub tagline ──────────────────────────────────────
                cs.beginText();
                cs.setFont(oblique, 11);
                cs.setNonStrokingColor(0.8f, 0.8f, 1f);
                cs.newLineAtOffset(margin, pageH - 76);
                cs.showText("Acheter maintenant, payer plus tard");
                cs.endText();

                // ── Receipt label (top-right) ─────────────────────────
                cs.beginText();
                cs.setFont(bold, 13);
                cs.setNonStrokingColor(1f, 1f, 1f);
                cs.newLineAtOffset(pageW - margin - 130, pageH - 60);
                cs.showText("RECU DE PAIEMENT");
                cs.endText();

                // ── Title section ─────────────────────────────────────
                float y = pageH - 155;
                cs.setNonStrokingColor(0.1f, 0.1f, 0.1f);
                cs.beginText();
                cs.setFont(bold, 20);
                cs.newLineAtOffset(margin, y);
                cs.showText("Payment Receipt");
                cs.endText();

                // ── Horizontal rule ───────────────────────────────────
                y -= 14;
                cs.setStrokingColor(0.85f, 0.85f, 0.85f);
                cs.setLineWidth(1.2f);
                cs.moveTo(margin, y);
                cs.lineTo(pageW - margin, y);
                cs.stroke();

                // ── Detail rows ───────────────────────────────────────
                y -= 30;
                String userName = payment.getUser().getFirstName() + " " + payment.getUser().getLastName();
                String txRef    = payment.getTransactionReference() != null
                        ? payment.getTransactionReference() : "REF-" + payment.getId();
                String amount   = payment.getAmount().toPlainString() + " TND";
                String date     = payment.getPaidAt() != null
                        ? payment.getPaidAt().format(DATE_FMT) : "-";
                String method   = maskMethod(payment.getPaymentMethod());

                Object[][] rows = {
                        {"Client",            userName},
                        {"Reference",         txRef},
                        {"Montant paye",      amount},
                        {"Date",              date},
                        {"Methode",           method},
                        {"Statut",            "PAYE"},
                };

                for (Object[] row : rows) {
                    // label
                    cs.beginText();
                    cs.setFont(regular, 11);
                    cs.setNonStrokingColor(0.45f, 0.45f, 0.45f);
                    cs.newLineAtOffset(margin, y);
                    cs.showText((String) row[0]);
                    cs.endText();

                    // value
                    String val = (String) row[1];
                    boolean isStatus = "PAYE".equals(val);
                    cs.beginText();
                    cs.setFont(isStatus ? bold : regular, isStatus ? 12 : 11);
                    cs.setNonStrokingColor(
                            isStatus ? 0.04f : 0.1f,
                            isStatus ? 0.64f : 0.1f,
                            isStatus ? 0.22f : 0.1f);
                    cs.newLineAtOffset(margin + 170, y);
                    cs.showText(val);
                    cs.endText();

                    // row separator
                    y -= 6;
                    cs.setStrokingColor(0.93f, 0.93f, 0.93f);
                    cs.setLineWidth(0.7f);
                    cs.moveTo(margin, y);
                    cs.lineTo(pageW - margin, y);
                    cs.stroke();
                    y -= 22;
                }

                // ── Amount highlight box ──────────────────────────────
                y -= 12;
                cs.setNonStrokingColor(0.95f, 0.97f, 1f);
                cs.addRect(margin, y - 14, contentW, 44);
                cs.fill();

                cs.beginText();
                cs.setFont(regular, 12);
                cs.setNonStrokingColor(0.3f, 0.3f, 0.3f);
                cs.newLineAtOffset(margin + 12, y + 10);
                cs.showText("Total paye");
                cs.endText();

                cs.beginText();
                cs.setFont(bold, 18);
                cs.setNonStrokingColor(0.11f, 0.11f, 0.95f);
                cs.newLineAtOffset(pageW - margin - 130, y + 10);
                cs.showText(amount);
                cs.endText();

                // ── Footer ────────────────────────────────────────────
                cs.setNonStrokingColor(0.11f, 0.11f, 0.95f);
                cs.addRect(0, 0, pageW, 48);
                cs.fill();

                cs.beginText();
                cs.setFont(oblique, 11);
                cs.setNonStrokingColor(0.9f, 0.9f, 1f);
                cs.newLineAtOffset(margin, 18);
                cs.showText("Merci pour votre paiement. CreadiTN - BNPL Tunisia");
                cs.endText();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate receipt PDF", e);
        }
    }

    private String maskMethod(String method) {
        if (method == null) return "Carte bancaire";
        return switch (method.toUpperCase()) {
            case "CARD" -> "Carte bancaire (**** 4242)";
            case "WALLET" -> "Portefeuille CreadiTN";
            default -> method;
        };
    }
}
