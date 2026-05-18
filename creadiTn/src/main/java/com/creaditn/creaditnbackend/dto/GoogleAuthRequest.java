package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GoogleAuthRequest {
    private String idToken;
    private String accessToken;
}
