package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.KycStatus;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String profession;
    private String profilePhotoUrl;

    private KycStatus kycStatus;
    private LocalDateTime createdAt;
}
