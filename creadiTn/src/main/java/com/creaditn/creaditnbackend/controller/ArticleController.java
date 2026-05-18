package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.ArticleResponse;
import com.creaditn.creaditnbackend.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    @GetMapping("/popular")
    public ResponseEntity<List<ArticleResponse>> getPopularArticles(
            @RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(articleService.getPopularArticles(limit));
    }

    @GetMapping
    public ResponseEntity<List<ArticleResponse>> getArticles(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String boutiqueName,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(articleService.getPublicArticles(category, boutiqueName, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArticleResponse> getArticle(@PathVariable Long id) {
        return ResponseEntity.ok(articleService.getPublicArticle(id));
    }
}
