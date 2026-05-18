package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.AccountStatusDto;
import com.creaditn.creaditnbackend.dto.PasswordChangeRequest;
import com.creaditn.creaditnbackend.dto.UserDto;
import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final InstallmentRepository installmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final CreditRequestRepository creditRequestRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final CardRepository cardRepository;
    private final NotificationRepository notificationRepository;
    private final CreadiScoreRepository creadiScoreRepository;
    private final TransactionRepository transactionRepository;
    private final FinancialProfileRepository financialProfileRepository;
    private final UserWalletRepository userWalletRepository;

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToDto(user);
    }

    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToDto(user);
    }

    public void changePassword(Long userId, PasswordChangeRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new BadRequestException("Mot de passe actuel incorrect.");
        }
        if (req.getNewPassword() == null || req.getNewPassword().length() < 6) {
            throw new BadRequestException("Le nouveau mot de passe doit contenir au moins 6 caractères.");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    public UserDto updateProfile(Long id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (dto.getFirstName() != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) user.setLastName(dto.getLastName());
        if (dto.getEmail() != null) {
            String normalizedEmail = dto.getEmail().trim().toLowerCase();
            if (!normalizedEmail.equalsIgnoreCase(user.getEmail())
                    && userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new BadRequestException("Email already registered");
            }
            user.setEmail(normalizedEmail);
        }
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getAddress() != null) user.setAddress(dto.getAddress());
        if (dto.getProfession() != null) user.setProfession(dto.getProfession());
        if (dto.getProfilePhotoUrl() != null) user.setProfilePhotoUrl(dto.getProfilePhotoUrl());

        userRepository.save(user);
        return mapToDto(user);
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToDto).toList();
    }

    public AccountStatusDto getAccountStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<Installment> all = installmentRepository.findByCreditRequestUserId(userId);
        int total = all.size();
        int paid    = (int) all.stream().filter(i -> i.getStatus() == InstallmentStatus.PAID).count();
        int pending = (int) all.stream().filter(i -> i.getStatus() == InstallmentStatus.PENDING).count();
        int overdue = (int) all.stream().filter(i -> i.getStatus() == InstallmentStatus.OVERDUE).count();

        Installment next = all.stream()
                .filter(i -> i.getStatus() != InstallmentStatus.PAID)
                .min(Comparator.comparing(Installment::getDueDate))
                .orElse(null);

        String payerStatus;
        if (overdue > 0) {
            payerStatus = "RISQUE";
        } else if (paid > 0) {
            payerStatus = "BON_PAYEUR";
        } else {
            payerStatus = "NEUTRE";
        }

        return AccountStatusDto.builder()
                .autopay(Boolean.TRUE.equals(user.getAutopay()))
                .nextInstallmentDate(next != null ? next.getDueDate().toString() : null)
                .nextInstallmentAmount(next != null ? next.getAmount().doubleValue() : null)
                .paidCount(paid)
                .totalCount(total)
                .pendingCount(pending)
                .overdueCount(overdue)
                .payerStatus(payerStatus)
                .build();
    }

    public User findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public void deactivateAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        long pendingOrOverdue = installmentRepository.findByCreditRequestUserId(userId)
                .stream()
                .filter(i -> i.getStatus() == InstallmentStatus.PENDING
                        || i.getStatus() == InstallmentStatus.OVERDUE)
                .count();

        if (pendingOrOverdue > 0) {
            throw new BadRequestException(
                    "Impossible de supprimer votre compte : vous avez " + pendingOrOverdue +
                    " échéance(s) en attente ou en retard. Veuillez les régler avant de supprimer votre compte.");
        }

        // 1. Payments
        paymentRepository.deleteAll(paymentRepository.findByUserId(userId));

        // 2. Invoices
        invoiceRepository.deleteAll(invoiceRepository.findByUserId(userId));

        // 3. Installments
        installmentRepository.deleteAll(installmentRepository.findByCreditRequestUserId(userId));

        // 4. PurchaseOrders
        purchaseOrderRepository.deleteAll(purchaseOrderRepository.findByUserIdOrderByCreatedAtDesc(userId));

        // 5. CreditRequests
        creditRequestRepository.deleteAll(creditRequestRepository.findByUserId(userId));

        // 6. ⚠️ KYC documents are intentionally NOT deleted.
        //    The unique constraints on didit_identity_id / cin_number_unique / image hashes
        //    remain active, permanently preventing re-registration with the same identity.
        //    This is the security hard-lock: same ID card = blocked forever.

        // 7. Cards
        cardRepository.deleteAll(cardRepository.findByUserIdOrderByCreatedAtDesc(userId));

        // 8. Notifications
        notificationRepository.deleteAll(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));

        // 9. CreadiScores
        creadiScoreRepository.deleteAll(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(userId));

        // 10. Transactions
        transactionRepository.deleteAll(transactionRepository.findByUserIdOrderByCreatedAtDesc(userId));

        // 11. FinancialProfile
        financialProfileRepository.findByUserId(userId).ifPresent(financialProfileRepository::delete);

        // 12. UserWallet
        userWalletRepository.findByUserId(userId).ifPresent(userWalletRepository::delete);

        // 13. Soft-delete: mark account as deleted and scramble PII so the email can be re-used
        //     by a *new* account, but the identity lock remains on the KYC documents.
        user.setAccountDeleted(true);
        user.setFirstName("Deleted");
        user.setLastName("User");
        user.setPhone(null);
        user.setAddress(null);
        user.setProfession(null);
        user.setProfilePhotoUrl(null);
        // Scramble email so a new account can register with the same email address
        user.setEmail("deleted_" + userId + "_" + System.currentTimeMillis() + "@deleted.invalid");
        // Invalidate password — bcrypt hash of a random UUID is unguessable
        user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
        userRepository.save(user);
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .profession(user.getProfession())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .kycStatus(user.getKycStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
