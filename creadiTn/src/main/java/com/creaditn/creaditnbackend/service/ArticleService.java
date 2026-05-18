package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.ArticleRequest;
import com.creaditn.creaditnbackend.dto.ArticleResponse;
import com.creaditn.creaditnbackend.entity.Article;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.ArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final SocketEventService socketEventService;

    public List<ArticleResponse> getPopularArticles(int limit) {
        return articleRepository.findPopular(PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<ArticleResponse> getPublicArticles(String category, String boutiqueName, String searchTerm) {
        return articleRepository.searchArticles(
                        normalize(category),
                        normalize(boutiqueName),
                        normalize(searchTerm),
                        false
                )
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<ArticleResponse> getAdminArticles(String category, String boutiqueName, String searchTerm) {
        return articleRepository.searchArticles(
                        normalize(category),
                        normalize(boutiqueName),
                        normalize(searchTerm),
                        false
                )
                .stream()
                .map(this::toDto)
                .toList();
    }

    public ArticleResponse getPublicArticle(Long id) {
        Article article = articleRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        return toDto(article);
    }

    public Article getActiveArticleEntity(Long id) {
        return articleRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
    }

    public Article getArticleEntity(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
    }

    @Transactional
    public ArticleResponse createArticle(ArticleRequest request) {
        if (request.getSourceUrl() != null && !request.getSourceUrl().isBlank()) {
            if (articleRepository.existsBySourceUrl(request.getSourceUrl().trim())) {
                throw new IllegalStateException("Ce produit est deja importe.");
            }
        }
        Article article = Article.builder()
                .productName(clean(request.getProductName()))
                .description(clean(request.getDescription()))
                .price(request.getPrice())
                .imageUrl(clean(request.getImageUrl()))
                .boutiqueName(clean(request.getBoutiqueName()))
                .category(clean(request.getCategory()))
                .sourceUrl(request.getSourceUrl() != null && !request.getSourceUrl().isBlank() ? request.getSourceUrl().trim() : null)
                .active(true)
                .build();

        articleRepository.save(article);
        ArticleResponse dto = toDto(article);
        socketEventService.emitNewArticle(dto);
        return dto;
    }

    @Transactional
    public ArticleResponse updateArticle(Long id, ArticleRequest request) {
        Article article = getArticleEntity(id);

        article.setProductName(clean(request.getProductName()));
        article.setDescription(clean(request.getDescription()));
        article.setPrice(request.getPrice());
        article.setImageUrl(clean(request.getImageUrl()));
        article.setBoutiqueName(clean(request.getBoutiqueName()));
        article.setCategory(clean(request.getCategory()));
        if (request.getSourceUrl() != null && !request.getSourceUrl().isBlank()) {
            article.setSourceUrl(request.getSourceUrl().trim());
        }

        articleRepository.save(article);
        ArticleResponse dto = toDto(article);
        socketEventService.emitUpdateArticle(dto);
        return dto;
    }

    @Transactional
    public void deleteArticle(Long id) {
        Article article = getArticleEntity(id);
        article.setActive(false);
        articleRepository.save(article);
        socketEventService.emitDeleteArticle(id);
    }

    public long getActiveArticlesCount() {
        return articleRepository.countByActiveTrue();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }

    private ArticleResponse toDto(Article article) {
        return ArticleResponse.builder()
                .id(article.getId())
                .productName(article.getProductName())
                .description(article.getDescription())
                .price(article.getPrice())
                .imageUrl(article.getImageUrl())
                .boutiqueName(article.getBoutiqueName())
                .category(article.getCategory())
                .active(article.getActive())
                .sourceUrl(article.getSourceUrl())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }
}
