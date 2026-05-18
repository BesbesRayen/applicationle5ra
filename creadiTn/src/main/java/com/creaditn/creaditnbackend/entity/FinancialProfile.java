package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialProfile {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private User user;

	@Column(name = "monthly_salary", nullable = false, precision = 12, scale = 2)
	private BigDecimal monthlySalary;

	@Column(name = "salary_day", nullable = false)
	private Integer salaryDay;

	@Enumerated(EnumType.STRING)
	@Column(name = "employment_status", nullable = false, length = 30)
	private EmploymentStatus employmentStatus;

	@Enumerated(EnumType.STRING)
	@Column(name = "risk_level", nullable = false, length = 20)
	private RiskLevel riskLevel;

	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		createdAt = LocalDateTime.now();
		updatedAt = LocalDateTime.now();
		if (riskLevel == null) {
			riskLevel = RiskLevel.MODERATE;
		}
	}

	@PreUpdate
	protected void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
