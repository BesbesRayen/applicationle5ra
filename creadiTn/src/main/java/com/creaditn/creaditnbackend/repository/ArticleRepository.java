package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Article;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    Optional<Article> findByIdAndActiveTrue(Long id);

    boolean existsBySourceUrl(String sourceUrl);

    long countByActiveTrue();

    @Query("SELECT a FROM Article a WHERE a.active = true ORDER BY a.createdAt DESC")
    List<Article> findPopular(Pageable pageable);

    @Query("""
            SELECT a FROM Article a
            WHERE (:includeInactive = true OR a.active = true)
              AND (:category IS NULL OR lower(a.category) = lower(:category))
              AND (:boutiqueName IS NULL OR lower(a.boutiqueName) = lower(:boutiqueName))
              AND (:searchTerm IS NULL
                   OR lower(a.productName) LIKE lower(concat('%', :searchTerm, '%'))
                   OR lower(a.description) LIKE lower(concat('%', :searchTerm, '%')))
            ORDER BY a.createdAt DESC
            """)
    List<Article> searchArticles(
            @Param("category") String category,
            @Param("boutiqueName") String boutiqueName,
            @Param("searchTerm") String searchTerm,
            @Param("includeInactive") boolean includeInactive
    );
}
