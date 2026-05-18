package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.AdminNotificationDto;
import com.creaditn.creaditnbackend.entity.AdminNotification;
import com.creaditn.creaditnbackend.entity.AdminNotificationType;
import com.creaditn.creaditnbackend.entity.Invoice;
import com.creaditn.creaditnbackend.entity.PurchaseOrder;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.AdminNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminNotificationService {

    private final AdminNotificationRepository adminNotificationRepository;
    private final EmailService emailService;

    @Value("${app.admin.notification.email:admin@bnpl.com}")
    private String adminEmail;

    @Value("${app.admin.notification.email-enabled:false}")
    private boolean adminEmailEnabled;

    @Transactional
    public void notifyCreditPurchase(PurchaseOrder order, Invoice invoice) {
        String title = "New credit purchase";
        String message = "Client " + order.getUser().getFirstName() + " " + order.getUser().getLastName()
                + " purchased " + order.getArticleName()
                + " on credit. Transaction: " + order.getTransactionId()
                + ", installments: " + order.getInstallmentMonths() + ".";

        AdminNotification notification = AdminNotification.builder()
                .title(title)
                .message(message)
                .type(AdminNotificationType.NEW_CREDIT_PURCHASE)
                .read(false)
                .orderId(order.getId())
                .transactionId(order.getTransactionId())
                .build();
        adminNotificationRepository.save(notification);

        AdminNotification invoiceNotification = AdminNotification.builder()
                .title("Invoice generated")
                .message("Invoice " + invoice.getInvoiceNumber() + " generated for transaction " + order.getTransactionId())
                .type(AdminNotificationType.INVOICE_GENERATED)
                .read(false)
                .orderId(order.getId())
                .transactionId(order.getTransactionId())
                .build();
        adminNotificationRepository.save(invoiceNotification);

        if (adminEmailEnabled && adminEmail != null && !adminEmail.isBlank()) {
            String body = "<h2>New Credit Purchase</h2>"
                    + "<p><strong>Client:</strong> " + order.getUser().getFirstName() + " " + order.getUser().getLastName() + "</p>"
                    + "<p><strong>Email:</strong> " + order.getUser().getEmail() + "</p>"
                    + "<p><strong>Phone:</strong> " + (order.getUser().getPhone() == null ? "-" : order.getUser().getPhone()) + "</p>"
                    + "<p><strong>Article:</strong> " + order.getArticleName() + "</p>"
                    + "<p><strong>Total:</strong> " + order.getTotalPrice() + " TND</p>"
                    + "<p><strong>Installments:</strong> " + order.getInstallmentMonths() + "</p>"
                    + "<p><strong>Transaction ID:</strong> " + order.getTransactionId() + "</p>"
                    + "<p><strong>Invoice:</strong> " + invoice.getInvoiceNumber() + "</p>";
            emailService.send(adminEmail, "[CreadiTN] New credit purchase", body);
        }
    }

    public List<AdminNotificationDto> getAll() {
        return adminNotificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<AdminNotificationDto> getUnread() {
        return adminNotificationRepository.findByReadFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public long getUnreadCount() {
        return adminNotificationRepository.countByReadFalse();
    }

    @Transactional
    public void markAsRead(Long id) {
        AdminNotification notification = adminNotificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Admin notification not found"));
        notification.setRead(true);
        adminNotificationRepository.save(notification);
    }

    private AdminNotificationDto toDto(AdminNotification entity) {
        return AdminNotificationDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .type(entity.getType())
                .read(entity.getRead())
                .orderId(entity.getOrderId())
                .transactionId(entity.getTransactionId())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
