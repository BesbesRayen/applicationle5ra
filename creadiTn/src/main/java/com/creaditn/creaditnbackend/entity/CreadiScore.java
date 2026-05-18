package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "creadi_scores")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreadiScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer totalScore;

    private Integer kycScore;
    private Integer salaryScore;
    private Integer maritalScore;
    private Integer childrenScore;
    private Integer behaviorScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScoreLevel level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel risk;

    private String reason;

    private String badge;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
