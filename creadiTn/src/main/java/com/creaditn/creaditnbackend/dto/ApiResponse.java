package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ApiResponse {
    private boolean success;
    private String message;
    private Object data;

    public static ApiResponse success(String message) {
        return ApiResponse.builder().success(true).message(message).build();
    }

    public static ApiResponse success(String message, Object data) {
        return ApiResponse.builder().success(true).message(message).data(data).build();
    }

    public static ApiResponse error(String message) {
        return ApiResponse.builder().success(false).message(message).build();
    }
}
