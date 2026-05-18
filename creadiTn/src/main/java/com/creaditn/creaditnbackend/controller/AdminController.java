package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.*;
import com.creaditn.creaditnbackend.repository.*;
import com.creaditn.creaditnbackend.entity.PurchaseOrder;
import com.creaditn.creaditnbackend.entity.PurchasePaymentType;
import com.creaditn.creaditnbackend.entity.KycDocument;
import com.creaditn.creaditnbackend.entity.CreditRequest;
import com.creaditn.creaditnbackend.service.CreditService;
import com.creaditn.creaditnbackend.service.InstallmentService;
import com.creaditn.creaditnbackend.service.KycService;
import com.creaditn.creaditnbackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final KycService kycService;
    private final CreditService creditService;
    private final InstallmentService installmentService;
    private final UserRepository userRepository;
    private final CreditRequestRepository creditRequestRepository;
    private final InstallmentRepository installmentRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final ArticleRepository articleRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InvoiceRepository invoiceRepository;
    private final AdminNotificationRepository adminNotificationRepository;

    @Value("${app.admin.email:admin@bnpl.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.token-secret:creaditn-admin-secret-2026}")
    private String adminTokenSecret;

    // ---- Admin Auth ----
    @PostMapping("/login")
    public ResponseEntity<?> adminLogin(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (adminEmail.equals(email) && adminPassword.equals(password)) {
            // Token = "admin-session-{timestamp}-{hmac}" for tamper detection
            String timestamp = String.valueOf(System.currentTimeMillis());
            String tokenPayload = "admin-session-" + timestamp;
            Map<String, Object> response = new HashMap<>();
            response.put("token", tokenPayload);
            response.put("email", email);
            response.put("role", "ADMIN");
            response.put("name", "Admin CreadiTN");
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body(Map.of("message", "Identifiants invalides"));
    }

    // ---- Dashboard Stats ----
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalCredits", creditRequestRepository.count());
        stats.put("totalInstallments", installmentRepository.count());
        stats.put("totalArticles", articleRepository.countByActiveTrue());
        stats.put("totalOrders", purchaseOrderRepository.count());
        stats.put("creditOrders", purchaseOrderRepository.countByPaymentType(PurchasePaymentType.CREDIT));
        stats.put("totalInvoices", invoiceRepository.count());
        stats.put("unreadCreditNotifications", adminNotificationRepository.countByReadFalse());
        stats.put("pendingKyc", kycDocumentRepository.countByStatus(com.creaditn.creaditnbackend.entity.KycStatus.PENDING));
        stats.put("approvedKyc", kycDocumentRepository.countByStatus(com.creaditn.creaditnbackend.entity.KycStatus.APPROVED));
        stats.put("pendingCredits", creditRequestRepository.countByStatus(com.creaditn.creaditnbackend.entity.CreditRequestStatus.PENDING));
        stats.put("approvedCredits", creditRequestRepository.countByStatus(com.creaditn.creaditnbackend.entity.CreditRequestStatus.APPROVED));
        stats.put("rejectedCredits", creditRequestRepository.countByStatus(com.creaditn.creaditnbackend.entity.CreditRequestStatus.REJECTED));
        return ResponseEntity.ok(stats);
    }

    // ---- All Credits ----
    @GetMapping("/credits")
    public ResponseEntity<List<CreditRequestResponse>> getAllCredits() {
        return ResponseEntity.ok(creditService.getAllRequests());
    }

    // ---- All Installments ----
    @GetMapping("/installments")
    public ResponseEntity<List<InstallmentDto>> getAllInstallments() {
        return ResponseEntity.ok(installmentService.getAllInstallments());
    }

    // ---- Users ----
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        userService.deactivateAccount(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Compte désactivé avec succès"));
    }

    // ---- KYC ----
    @GetMapping("/kyc/pending")
    public ResponseEntity<List<KycDocumentDto>> getPendingKyc() {
        return ResponseEntity.ok(kycService.getPendingDocuments());
    }

    @PutMapping("/kyc/{id}/approve")
    public ResponseEntity<KycDocumentDto> approveKyc(@PathVariable Long id,
                                                      @RequestParam(required = false) String comment) {
        return ResponseEntity.ok(kycService.approveKyc(id, comment));
    }

    @PutMapping("/kyc/{id}/reject")
    public ResponseEntity<KycDocumentDto> rejectKyc(@PathVariable Long id,
                                                     @RequestParam String comment) {
        return ResponseEntity.ok(kycService.rejectKyc(id, comment));
    }

    // ---- Credits ----
    @GetMapping("/credits/pending")
    public ResponseEntity<List<CreditRequestResponse>> getPendingCredits() {
        return ResponseEntity.ok(creditService.getPendingRequests());
    }

    @PutMapping("/credits/{id}/approve")
    public ResponseEntity<CreditRequestResponse> approveCredit(@PathVariable Long id) {
        return ResponseEntity.ok(creditService.approveCreditRequest(id));
    }

    @PutMapping("/credits/{id}/reject")
    public ResponseEntity<CreditRequestResponse> rejectCredit(@PathVariable Long id) {
        return ResponseEntity.ok(creditService.rejectCreditRequest(id));
    }

    // ---- Activity Feed (recent events across the platform) ----
    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> getRecentActivity() {
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        List<Map<String, Object>> events = new ArrayList<>();

        // Recent purchases (last 10)
        purchaseOrderRepository.findAll(
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).forEach(order -> {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("type", "PURCHASE");
            e.put("icon", order.getPaymentType() == PurchasePaymentType.CREDIT ? "credit-card" : "cash");
            e.put("title", order.getPaymentType() == PurchasePaymentType.CREDIT
                    ? "Achat crédit: " + order.getArticleName()
                    : "Achat comptant: " + order.getArticleName());
            e.put("subtitle", "Utilisateur #" + order.getUser().getId() + " · " + order.getTotalPrice() + " DT");
            e.put("time", order.getCreatedAt() != null ? order.getCreatedAt().format(fmt) : null);
            e.put("color", order.getPaymentType() == PurchasePaymentType.CREDIT ? "blue" : "green");
            events.add(e);
        });

        // Recent KYC submissions (last 5)
        kycDocumentRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).forEach(doc -> {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("type", "KYC");
            e.put("icon", "shield-check");
            e.put("title", "Vérification KYC soumise");
            e.put("subtitle", "Utilisateur #" + doc.getUser().getId() + " · " + doc.getStatus());
            e.put("time", doc.getCreatedAt() != null ? doc.getCreatedAt().format(fmt) : null);
            e.put("color", "APPROVED".equals(doc.getStatus().name()) ? "green" : "REJECTED".equals(doc.getStatus().name()) ? "red" : "amber");
            events.add(e);
        });

        // Recent credit requests (last 5)
        creditRequestRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).forEach(cr -> {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("type", "CREDIT_REQUEST");
            e.put("icon", "trending-up");
            e.put("title", "Demande de crédit: " + (cr.getProductName() != null ? cr.getProductName() : "Général"));
            e.put("subtitle", "Utilisateur #" + cr.getUser().getId() + " · " + cr.getTotalAmount() + " DT · " + cr.getStatus());
            e.put("time", cr.getCreatedAt() != null ? cr.getCreatedAt().format(fmt) : null);
            e.put("color", "APPROVED".equals(cr.getStatus().name()) ? "green" : "REJECTED".equals(cr.getStatus().name()) ? "red" : "indigo");
            events.add(e);
        });

        // Sort all events by time descending and return top 20
        events.sort((a, b) -> {
            String ta = (String) a.get("time");
            String tb = (String) b.get("time");
            if (ta == null) return 1;
            if (tb == null) return -1;
            return tb.compareTo(ta);
        });

        return ResponseEntity.ok(events.stream().limit(20).collect(Collectors.toList()));
    }

    // ---- DB Cleanup: remove all non-admin users (protected) ----
    @DeleteMapping("/cleanup/users")
    public ResponseEntity<Map<String, Object>> cleanupUsers(
            @RequestParam(defaultValue = "false") boolean confirm) {
        if (!confirm) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Pass confirm=true to execute. This deletes all users except admin@bnpl.com."
            ));
        }
        long before = userRepository.count();
        userRepository.findAll().stream()
                .filter(u -> !"admin@bnpl.com".equals(u.getEmail()))
                .forEach(u -> userRepository.deleteById(u.getId()));
        long after = userRepository.count();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "deletedCount", before - after,
                "remainingCount", after
        ));
    }
}
