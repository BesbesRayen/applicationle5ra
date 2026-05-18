package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Card {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "card_number", nullable = false, length = 1024)
	private String cardNumber;

	@Column(name = "last4", length = 4)
	private String last4;

	@Column(name = "expiry_date", nullable = false, length = 5)
	private String expiryDate;

	@Column(name = "cardholder_name", length = 100)
	private String cardholderName;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private CardType type;

	@Column(name = "is_default", nullable = false)
	private Boolean isDefault;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private CardStatus status;

	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
		updatedAt = LocalDateTime.now();
		if (isDefault == null) {
			isDefault = false;
		}
		if (status == null) {
			status = CardStatus.ACTIVE;
		}
	}

	@PreUpdate
	protected void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
