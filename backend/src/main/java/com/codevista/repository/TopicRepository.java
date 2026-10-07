package com.codevista.repository;

import com.codevista.entity.Difficulty;
import com.codevista.entity.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {

    Optional<Topic> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Topic> findAllByOrderBySortOrderAsc();

    List<Topic> findAllByOrderByTitleAsc();

    List<Topic> findByDifficultyOrderBySortOrderAsc(Difficulty difficulty);

    List<Topic> findByDifficultyOrderByTitleAsc(Difficulty difficulty);

    @Query("SELECT t FROM Topic t WHERE " +
            "(:difficulty IS NULL OR t.difficulty = :difficulty) AND " +
            "(:query IS NULL OR :query = '' OR " +
            "LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.slug) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY t.sortOrder ASC")
    List<Topic> searchTopics(@Param("query") String query, @Param("difficulty") Difficulty difficulty);

    @Query("SELECT t FROM Topic t WHERE " +
            "(:difficulty IS NULL OR t.difficulty = :difficulty) AND " +
            "(:query IS NULL OR :query = '' OR " +
            "LOWER(t.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(t.slug) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY t.title ASC")
    List<Topic> searchTopicsAlphabetical(@Param("query") String query, @Param("difficulty") Difficulty difficulty);
}

