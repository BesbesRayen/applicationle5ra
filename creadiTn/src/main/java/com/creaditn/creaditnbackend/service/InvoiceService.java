package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.InvoiceResponse;
import com.creaditn.creaditnbackend.entity.Invoice;
import com.creaditn.creaditnbackend.entity.InvoiceStatus;
import com.creaditn.creaditnbackend.entity.PurchaseOrder;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.FRANCE);

    @Transactional
    public Invoice createCreditInvoice(PurchaseOrder order) {
        return invoiceRepository.findByOrderId(order.getId())
                .orElseGet(() -> {
                    User user = order.getUser();
                    String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                            + (user.getLastName() == null ? "" : user.getLastName())).trim();

                    Invoice invoice = Invoice.builder()
                            .invoiceNumber(generateInvoiceNumber())
                            .transactionId(order.getTransactionId())
                            .order(order)
                            .user(user)
                            .clientName(fullName.isBlank() ? "Client" : fullName)
                            .clientEmail(user.getEmail())
                            .clientPhone(user.getPhone())
                            .articleName(order.getArticleName())
                            .boutiqueName(order.getBoutiqueName())
                            .totalPrice(order.getTotalPrice())
                            .financedAmount(order.getFinancedAmount())
                            .interestRate(order.getInterestRate())
                            .totalPayable(order.getTotalPayable())
                            .merchantMarginRate(order.getMerchantMarginRate())
                            .merchantPayoutAmount(order.getMerchantPayoutAmount())
                            .platformProfitAmount(order.getPlatformProfitAmount())
                            .paymentType(order.getPaymentType().name())
                            .numberOfInstallments(order.getInstallmentMonths() == null ? 0 : order.getInstallmentMonths())
                            .purchaseDate(order.getCreatedAt() == null ? LocalDateTime.now() : order.getCreatedAt())
                            .status(InvoiceStatus.ISSUED)
                            .statement("The application paid the boutique; the client must reimburse the application.")
                            .build();

                    return invoiceRepository.save(invoice);
                });
    }

    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAllByOrderByPurchaseDateDesc().stream()
                .map(this::toDto)
                .toList();
    }

    public InvoiceResponse getInvoice(Long id) {
        return toDto(getInvoiceEntity(id));
    }

    public Invoice getInvoiceEntity(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
    }

    public byte[] generateInvoicePdf(Long invoiceId) {
        Invoice invoice = getInvoiceEntity(invoiceId);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            float pageWidth = page.getMediaBox().getWidth();
            float pageHeight = page.getMediaBox().getHeight();
            float margin = 48;

            PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                // Header
                cs.setNonStrokingColor(0.06f, 0.16f, 0.39f);
                cs.addRect(0, pageHeight - 110, pageWidth, 110);
                cs.fill();

                writeText(cs, titleFont, 24, margin, pageHeight - 52, 1, 1, 1, "CreadiTN - Facture Credit");
                writeText(cs, bodyFont, 11, margin, pageHeight - 74, 0.85f, 0.92f, 1f,
                        "Application paid partner boutique. Client reimburses monthly.");

                float y = pageHeight - 150;
                writeText(cs, titleFont, 16, margin, y, 0.1f, 0.1f, 0.1f, "Invoice Details");
                y -= 24;

                String[][] lines = new String[][]{
                        {"Invoice number", invoice.getInvoiceNumber()},
                        {"Transaction ID", invoice.getTransactionId()},
                        {"Client", invoice.getClientName()},
                        {"Client email", safe(invoice.getClientEmail())},
                        {"Client phone", safe(invoice.getClientPhone())},
                        {"Article", safe(invoice.getArticleName())},
                        {"Boutique", safe(invoice.getBoutiqueName())},
                        {"Total", invoice.getTotalPrice().toPlainString() + " TND"},
                        {"Financed amount", invoice.getFinancedAmount().toPlainString() + " TND"},
                        {"Total payable", invoice.getTotalPayable().toPlainString() + " TND"},
                        {"Merchant payout", invoice.getMerchantPayoutAmount().toPlainString() + " TND"},
                        {"Platform profit", invoice.getPlatformProfitAmount().toPlainString() + " TND"},
                        {"Payment type", invoice.getPaymentType()},
                        {"Installments", String.valueOf(invoice.getNumberOfInstallments())},
                        {"Purchase date", invoice.getPurchaseDate().format(DATE_FORMAT)},
                        {"Status", invoice.getStatus().name()}
                };

                for (String[] line : lines) {
                    writeText(cs, bodyFont, 11, margin, y, 0.45f, 0.45f, 0.45f, line[0]);
                    writeText(cs, titleFont, 11, margin + 170, y, 0.12f, 0.12f, 0.12f, line[1]);
                    y -= 20;
                }

                y -= 8;
                cs.setNonStrokingColor(0.95f, 0.97f, 1f);
                cs.addRect(margin, y - 6, pageWidth - (margin * 2), 52);
                cs.fill();

                writeText(cs, bodyFont, 11, margin + 10, y + 24, 0.3f, 0.3f, 0.3f, "Business statement");
                writeText(cs, titleFont, 11, margin + 10, y + 8, 0.06f, 0.16f, 0.39f, safe(invoice.getStatement()));

                cs.setNonStrokingColor(0.06f, 0.16f, 0.39f);
                cs.addRect(0, 0, pageWidth, 42);
                cs.fill();
                writeText(cs, bodyFont, 10, margin, 16, 0.88f, 0.93f, 1f,
                        "Generated by CreadiTN Admin - " + LocalDateTime.now().format(DATE_FORMAT));
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            document.save(output);
            return output.toByteArray();
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate invoice PDF", ex);
        }
    }

    private String generateInvoiceNumber() {
        return "FAC-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE)
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private InvoiceResponse toDto(Invoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .transactionId(invoice.getTransactionId())
                .orderId(invoice.getOrder().getId())
                .clientName(invoice.getClientName())
                .clientEmail(invoice.getClientEmail())
                .clientPhone(invoice.getClientPhone())
                .articleName(invoice.getArticleName())
                .boutiqueName(invoice.getBoutiqueName())
                .totalPrice(invoice.getTotalPrice())
                .financedAmount(invoice.getFinancedAmount())
                .interestRate(invoice.getInterestRate())
                .totalPayable(invoice.getTotalPayable())
                .merchantMarginRate(invoice.getMerchantMarginRate())
                .merchantPayoutAmount(invoice.getMerchantPayoutAmount())
                .platformProfitAmount(invoice.getPlatformProfitAmount())
                .paymentType(invoice.getPaymentType())
                .numberOfInstallments(invoice.getNumberOfInstallments())
                .purchaseDate(invoice.getPurchaseDate())
                .status(invoice.getStatus())
                .statement(invoice.getStatement())
                .createdAt(invoice.getCreatedAt())
                .build();
    }

    private String safe(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private void writeText(PDPageContentStream cs,
                           PDType1Font font,
                           float size,
                           float x,
                           float y,
                           float r,
                           float g,
                           float b,
                           String text) throws Exception {
        cs.beginText();
        cs.setFont(font, size);
        cs.setNonStrokingColor(r, g, b);
        cs.newLineAtOffset(x, y);
        cs.showText(text == null ? "" : text);
        cs.endText();
    }
}
