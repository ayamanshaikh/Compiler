package com.codevista.repository;

import com.codevista.entity.CodeExample;
import com.codevista.entity.Difficulty;
import com.codevista.entity.Topic;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class TopicRepositoryTest {

    @Autowired
    private TopicRepository topicRepository;

    @Test
    @DisplayName("findBySlug finds the correct topic")
    void testFindBySlug() {
        Optional<Topic> topic = topicRepository.findBySlug("history-of-java");
        assertThat(topic).isPresent();
        assertThat(topic.get().getTitle()).isEqualTo("History of Java");
        assertThat(topic.get().getDifficulty()).isEqualTo(Difficulty.BEGINNER);
    }

    @Test
    @DisplayName("existsBySlug returns true for existing slug and false for non-existent")
    void testExistsBySlug() {
        assertThat(topicRepository.existsBySlug("comments")).isTrue();
        assertThat(topicRepository.existsBySlug("non-existent-topic")).isFalse();
    }

    @Test
    @DisplayName("findByDifficultyOrderBySortOrderAsc returns ordered topics of the given difficulty")
    void testFindByDifficultyOrderBySortOrderAsc() {
        List<Topic> beginnerTopics = topicRepository.findByDifficultyOrderBySortOrderAsc(Difficulty.BEGINNER);
        assertThat(beginnerTopics).isNotEmpty();
        assertThat(beginnerTopics).allMatch(t -> t.getDifficulty() == Difficulty.BEGINNER);

        // Verify sorted order
        for (int i = 0; i < beginnerTopics.size() - 1; i++) {
            assertThat(beginnerTopics.get(i).getSortOrder())
                    .isLessThanOrEqualTo(beginnerTopics.get(i + 1).getSortOrder());
        }
    }

    @Test
    @DisplayName("searchTopics matches title, description, or slug with case-insensitivity")
    void testSearchTopics() {
        List<Topic> results = topicRepository.searchTopics("exception", null);
        assertThat(results).isNotEmpty();
        assertThat(results).anyMatch(t -> t.getTitle().toLowerCase().contains("exception"));

        // Search with difficulty filter
        List<Topic> filtered = topicRepository.searchTopics("exception", Difficulty.INTERMEDIATE);
        assertThat(filtered).isNotEmpty();
        assertThat(filtered).allMatch(t -> t.getDifficulty() == Difficulty.INTERMEDIATE);
    }

    @Test
    @DisplayName("Persisting topic with collections saves and retrieves all embedded data")
    void testSaveTopicWithCollections() {
        Topic customTopic = new Topic(
                "Java Virtual Threads",
                "java-virtual-threads",
                "Lightweight threads introduced in Project Loom.",
                Difficulty.ADVANCED,
                "Unit 3: Exceptions & Multithreading",
                999
        );
        customTopic.setSyntax("Thread.startVirtualThread(runnable);");
        customTopic.getKeyPoints().add("Managed by JVM runtime");
        customTopic.getKeyPoints().add("Millions of concurrent threads supported");
        customTopic.getCommonMistakes().add("Pooling virtual threads instead of spawning per task");
        customTopic.getRelatedTopicSlugs().add("thread");
        customTopic.getRelatedTopicSlugs().add("multithreading");
        customTopic.getCodeExamples().add(new CodeExample(
                "Starting a Virtual Thread",
                "Thread.startVirtualThread(() -> System.out.println(\"Inside Virtual Thread\"));",
                "Spawns and executes a task on a lightweight virtual thread."
        ));

        Topic saved = topicRepository.save(customTopic);
        assertThat(saved.getId()).isNotNull();

        Optional<Topic> retrieved = topicRepository.findBySlug("java-virtual-threads");
        assertThat(retrieved).isPresent();
        Topic topic = retrieved.get();
        assertThat(topic.getTitle()).isEqualTo("Java Virtual Threads");
        assertThat(topic.getKeyPoints()).hasSize(2);
        assertThat(topic.getCommonMistakes()).hasSize(1);
        assertThat(topic.getRelatedTopicSlugs()).containsExactly("thread", "multithreading");
        assertThat(topic.getCodeExamples()).hasSize(1);
        assertThat(topic.getCodeExamples().get(0).getTitle()).isEqualTo("Starting a Virtual Thread");
    }
}

