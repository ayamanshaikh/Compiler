package com.codevista.practice.repository;

import com.codevista.entity.Difficulty;
import com.codevista.practice.entity.PracticeQuestion;
import com.codevista.practice.entity.QuestionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeQuestionRepository extends JpaRepository<PracticeQuestion, Long> {

    List<PracticeQuestion> findByTopicSlug(String topicSlug);

    List<PracticeQuestion> findByDifficulty(Difficulty difficulty);

    List<PracticeQuestion> findByQuestionType(QuestionType questionType);

    @Query("SELECT q FROM PracticeQuestion q WHERE " +
            "(:topicSlug IS NULL OR q.topicSlug = :topicSlug) AND " +
            "(:difficulty IS NULL OR q.difficulty = :difficulty) AND " +
            "(:questionType IS NULL OR q.questionType = :questionType) " +
            "ORDER BY q.id ASC")
    List<PracticeQuestion> findWithFilters(
            @Param("topicSlug") String topicSlug,
            @Param("difficulty") Difficulty difficulty,
            @Param("questionType") QuestionType questionType
    );

    long countByTopicSlug(String topicSlug);
}
