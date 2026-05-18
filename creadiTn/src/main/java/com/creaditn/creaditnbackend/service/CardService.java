package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.CardCreateRequest;
import com.creaditn.creaditnbackend.dto.CardDto;
import com.creaditn.creaditnbackend.entity.Card;
import com.creaditn.creaditnbackend.entity.CardStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.entity.UserWallet;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.CardRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.util.CardCryptoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final UserWalletRepository userWalletRepository;

    @Transactional
    public CardDto addCard(Long userId, CardCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String sanitizedNumber = request.getCardNumber().replaceAll("\\s+", "");
        if (!sanitizedNumber.matches("^\\d{13,19}$")) {
            throw new BadRequestException("Card number must contain 13 to 19 digits");
        }

        String encryptedNumber = CardCryptoUtil.encrypt(sanitizedNumber);
        String last4 = sanitizedNumber.substring(Math.max(0, sanitizedNumber.length() - 4));
        boolean hasCards = cardRepository.existsByUserId(userId);
        boolean shouldBeDefault = Boolean.TRUE.equals(request.getDefaultCard()) || !hasCards;

        if (shouldBeDefault) {
            unsetCurrentDefault(userId);
        }

        Card card = Card.builder()
                .user(user)
                .cardNumber(encryptedNumber)
                .last4(last4)
                .expiryDate(request.getExpiryDate())
                .cardholderName(request.getCardholderName())
                .type(request.getType())
                .isDefault(shouldBeDefault)
                .status(CardStatus.ACTIVE)
                .build();

        cardRepository.save(card);

        // Create wallet with 2000 TND if user doesn't have one yet
        if (!userWalletRepository.findByUserId(userId).isPresent()) {
            UserWallet wallet = UserWallet.builder()
                    .userId(userId)
                    .balance(new BigDecimal("2000.00"))
                    .build();
            userWalletRepository.save(wallet);
        }

        notificationService.sendNotification(
                userId,
                "Payment method added",
                "Your card " + CardCryptoUtil.maskCardNumber(sanitizedNumber) + " has been linked successfully.",
                NotificationType.PAYMENT_CONFIRMED
        );

        return toDto(card);
    }

    public List<CardDto> getCards(Long userId) {
        ensureUserExists(userId);
        return cardRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CardDto setDefaultCard(Long userId, Long cardId) {
        Card card = findUserCard(userId, cardId);
        if (card.getStatus() != CardStatus.ACTIVE) {
            throw new BadRequestException("Only active cards can be set as default");
        }

        unsetCurrentDefault(userId);
        card.setIsDefault(true);
        cardRepository.save(card);

        return toDto(card);
    }

    @Transactional
    public CardDto blockCard(Long userId, Long cardId) {
        Card card = findUserCard(userId, cardId);
        card.setStatus(CardStatus.BLOCKED);
        card.setIsDefault(false);
        cardRepository.save(card);

        // Ensure the user still has one default card when possible
        cardRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(c -> c.getStatus() == CardStatus.ACTIVE)
                .findFirst()
                .ifPresent(activeCard -> {
                    activeCard.setIsDefault(true);
                    cardRepository.save(activeCard);
                });

        return toDto(card);
    }

    public Card getDefaultActiveCard(Long userId) {
        Card defaultCard = cardRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new BadRequestException("Add a payment method"));

        if (defaultCard.getStatus() != CardStatus.ACTIVE) {
            throw new BadRequestException("Your default payment method is blocked. Please add a new active card");
        }

        return defaultCard;
    }

    public boolean hasActiveCard(Long userId) {
        return cardRepository.existsByUserIdAndStatus(userId, CardStatus.ACTIVE);
    }

    public CardDto getDefaultCard(Long userId) {
        return toDto(getDefaultActiveCard(userId));
    }

    private void unsetCurrentDefault(Long userId) {
        cardRepository.findByUserIdAndIsDefaultTrue(userId).ifPresent(existingDefault -> {
            existingDefault.setIsDefault(false);
            cardRepository.save(existingDefault);
        });
    }

    private Card findUserCard(Long userId, Long cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Card not found"));

        if (!card.getUser().getId().equals(userId)) {
            throw new BadRequestException("Card does not belong to user");
        }
        return card;
    }

    private void ensureUserExists(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private CardDto toDto(Card card) {
        String decryptedNumber = CardCryptoUtil.decrypt(card.getCardNumber());
        String last4 = card.getLast4() != null ? card.getLast4()
                : decryptedNumber.substring(Math.max(0, decryptedNumber.length() - 4));

        return CardDto.builder()
                .id(card.getId())
                .userId(card.getUser().getId())
                .maskedNumber(CardCryptoUtil.maskCardNumber(decryptedNumber))
                .last4(last4)
                .expiryDate(card.getExpiryDate())
                .cardholderName(card.getCardholderName())
                .type(card.getType())
                .defaultCard(card.getIsDefault())
                .status(card.getStatus())
                .createdAt(card.getCreatedAt())
                .build();
    }
}
