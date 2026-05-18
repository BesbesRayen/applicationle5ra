package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.CardStatus;
import com.creaditn.creaditnbackend.entity.CardType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardDto {
    private Long id;
    private Long userId;
    private String maskedNumber;
    private String last4;
    private String expiryDate;
    private String cardholderName;
    private CardType type;
    private Boolean defaultCard;
    private CardStatus status;
    private LocalDateTime createdAt;
}
