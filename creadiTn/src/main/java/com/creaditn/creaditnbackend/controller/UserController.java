package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.AccountStatusDto;
import com.creaditn.creaditnbackend.dto.ApiResponse;
import com.creaditn.creaditnbackend.dto.PasswordChangeRequest;
import com.creaditn.creaditnbackend.dto.UserDto;
import com.creaditn.creaditnbackend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse> health() {
        return ResponseEntity.ok(ApiResponse.success("User service is healthy"));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@RequestParam Long userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    /** Alias for mobile spec */
    @GetMapping("/profile")
    public ResponseEntity<UserDto> getProfile(@RequestParam Long userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @GetMapping("/account-status")
    public ResponseEntity<AccountStatusDto> getAccountStatus(@RequestParam Long userId) {
        return ResponseEntity.ok(userService.getAccountStatus(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(@RequestParam Long userId,
                                                  @RequestBody UserDto dto) {
        return ResponseEntity.ok(userService.updateProfile(userId, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse> changePassword(
            @RequestParam Long userId,
            @Valid @RequestBody PasswordChangeRequest body) {
        userService.changePassword(userId, body);
        return ResponseEntity.ok(ApiResponse.success("Password updated"));
    }

    @PostMapping("/photo")
    public ResponseEntity<UserDto> uploadProfilePhoto(
            @RequestParam Long userId,
            @RequestParam("file") MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String extension = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.'))
                : ".jpg";

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().build();
        }

        String fileName = UUID.randomUUID() + extension;
        Path baseDir = Paths.get(System.getProperty("user.dir"), "uploads", "profiles", String.valueOf(userId));
        Files.createDirectories(baseDir);
        Path filePath = baseDir.resolve(fileName);
        file.transferTo(filePath.toFile());

        String photoUrl = "/api/files/profiles/" + userId + "/" + fileName;
        UserDto dto = UserDto.builder().profilePhotoUrl(photoUrl).build();
        return ResponseEntity.ok(userService.updateProfile(userId, dto));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse> deleteAccount(@RequestParam Long userId) {
        userService.deactivateAccount(userId);
        return ResponseEntity.ok(ApiResponse.success("Compte supprimé avec succès"));
    }
}
