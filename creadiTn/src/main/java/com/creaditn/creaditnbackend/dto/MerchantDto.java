package com.creaditn.creaditnbackend.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MerchantDto {
    private Long id;
    private String name;
    private String category;
    private String address;
    private String phone;
    private String email;
    private String logoUrl;
    private Boolean active;
    private LocalDateTime createdAt;
}
