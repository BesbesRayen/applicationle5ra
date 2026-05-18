package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.KycStatus;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class KycDocumentDto {
    private Long id;
    private Long userId;
    private String cinFrontUrl;
    private String cinBackUrl;
    private String selfieUrl;
    private String cinNumber;
    private String ocrResult;
    private Double faceMatchScore;
    private KycStatus status;
    private String adminComment;
    private LocalDateTime createdAt;
}
