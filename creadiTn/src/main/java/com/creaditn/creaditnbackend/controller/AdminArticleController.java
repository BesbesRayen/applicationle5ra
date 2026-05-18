package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.ApiResponse;
import com.creaditn.creaditnbackend.dto.ArticleRequest;
import com.creaditn.creaditnbackend.dto.ArticleResponse;
import com.creaditn.creaditnbackend.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/articles")
@RequiredArgsConstructor
public class AdminArticleController {

    private final ArticleService articleService;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping
    public ResponseEntity<List<ArticleResponse>> getArticles(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String boutiqueName,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(articleService.getAdminArticles(category, boutiqueName, search));
    }

    @PostMapping
    public ResponseEntity<ArticleResponse> createArticle(@Valid @RequestBody ArticleRequest request) {
        return ResponseEntity.ok(articleService.createArticle(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArticleResponse> updateArticle(
            @PathVariable Long id,
            @Valid @RequestBody ArticleRequest request
    ) {
        return ResponseEntity.ok(articleService.updateArticle(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok(ApiResponse.success("Article deleted"));
    }

    /**
     * Upload a product image. Returns {"imageUrl": "/api/files/articles/uuid.jpg"}
     * Accepts only image/jpeg and image/png, max 5 MB.
     */
    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only jpg/png images are allowed"));
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File size must not exceed 5 MB"));
        }

        Path articlesDir = Paths.get(System.getProperty("user.dir"), uploadDir, "articles");
        Files.createDirectories(articlesDir);

        String extension = contentType.equals("image/png") ? ".png" : ".jpg";
        String filename = UUID.randomUUID() + extension;
        Path dest = articlesDir.resolve(filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        String imageUrl = "/api/files/articles/" + filename;
        return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
    }
}
