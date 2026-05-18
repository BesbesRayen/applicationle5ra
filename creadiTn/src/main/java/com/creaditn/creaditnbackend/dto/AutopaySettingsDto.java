package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AutopaySettingsDto {
    private boolean enabled;
    private String dayOfMonth;
}
