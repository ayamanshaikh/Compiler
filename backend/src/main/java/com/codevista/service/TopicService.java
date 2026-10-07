package com.codevista.service;

import com.codevista.dto.TopicCreateRequest;
import com.codevista.dto.TopicResponse;
import com.codevista.dto.TopicSummaryResponse;
import com.codevista.entity.CodeExample;
import com.codevista.entity.Difficulty;
import com.codevista.entity.Topic;
import com.codevista.exception.ApiException;
import com.codevista.exception.ResourceNotFoundException;
import com.codevista.repository.TopicRepository;
import com.codevista.config.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TopicService {

    private final TopicRepository topicRepository;

    public TopicService(TopicRepository topicRepository) {
        this.topicRepository = topicRepository;
    }

    @Transactional(readOnly = true)
    public List<TopicSummaryResponse> getTopics(Difficulty difficulty, String search) {
        return getTopics(difficulty, search, "order");
    }

    @Cacheable(value = CacheConfig.TOPIC_SUMMARIES_CACHE, key = "(#difficulty != null ? #difficulty.name() : 'ALL') + ':' + (#search != null ? #search : '') + ':' + (#sortBy != null ? #sortBy : '')")
    @Transactional(readOnly = true)
    public List<TopicSummaryResponse> getTopics(Difficulty difficulty, String search, String sortBy) {
        boolean alphabetical = "title".equalsIgnoreCase(sortBy) || "alphabetical".equalsIgnoreCase(sortBy);
        List<Topic> topics;

        if (search != null && !search.isBlank()) {
            topics = alphabetical
                    ? topicRepository.searchTopicsAlphabetical(search.trim(), difficulty)
                    : topicRepository.searchTopics(search.trim(), difficulty);
        } else if (difficulty != null) {
            topics = alphabetical
                    ? topicRepository.findByDifficultyOrderByTitleAsc(difficulty)
                    : topicRepository.findByDifficultyOrderBySortOrderAsc(difficulty);
        } else {
            topics = alphabetical
                    ? topicRepository.findAllByOrderByTitleAsc()
                    : topicRepository.findAllByOrderBySortOrderAsc();
        }

        return topics.stream()
                .map(TopicSummaryResponse::new)
                .collect(Collectors.toList());
    }

    @Cacheable(value = CacheConfig.TOPICS_CACHE, key = "#slug")
    @Transactional(readOnly = true)
    public TopicResponse getTopicBySlug(String slug) {
        Topic topic = topicRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with slug: " + slug));

        return new TopicResponse(topic);
    }

    @Transactional(readOnly = true)
    public List<TopicSummaryResponse> searchTopics(String query, Difficulty difficulty) {
        String cleanQuery = (query != null) ? query.trim() : "";
        List<Topic> topics = topicRepository.searchTopics(cleanQuery, difficulty);
        return topics.stream()
                .map(TopicSummaryResponse::new)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = {CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_SUMMARIES_CACHE}, allEntries = true)
    @Transactional
    public TopicResponse createTopic(TopicCreateRequest request) {
        if (topicRepository.existsBySlug(request.getSlug())) {
            throw new ApiException("Topic with slug '" + request.getSlug() + "' already exists", HttpStatus.CONFLICT);
        }

        Topic topic = new Topic(
                request.getTitle(),
                request.getSlug(),
                request.getDescription(),
                request.getDifficulty(),
                request.getInternalUnit(),
                request.getSortOrder()
        );

        topic.setExplanation(request.getExplanation());
        topic.setWhyItMatters(request.getWhyItMatters());
        topic.setSyntax(request.getSyntax());
        topic.setKeyPoints(request.getKeyPoints());
        topic.setCommonMistakes(request.getCommonMistakes());
        topic.setRelatedTopicSlugs(request.getRelatedTopicSlugs());

        if (request.getCodeExamples() != null) {
            List<CodeExample> examples = request.getCodeExamples().stream()
                    .map(dto -> new CodeExample(dto.getTitle(), dto.getCode(), dto.getExplanation()))
                    .collect(Collectors.toList());
            topic.setCodeExamples(examples);
        }

        Topic saved = topicRepository.save(topic);
        return new TopicResponse(saved);
    }

    @Cacheable(value = CacheConfig.TOPICS_CACHE, key = "#id")
    @Transactional(readOnly = true)
    public TopicResponse getTopicById(Long id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));
        return new TopicResponse(topic);
    }

    @CacheEvict(value = {CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_SUMMARIES_CACHE}, allEntries = true)
    @Transactional
    public TopicResponse updateTopic(Long id, TopicCreateRequest request) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));

        if (!topic.getSlug().equalsIgnoreCase(request.getSlug()) && topicRepository.existsBySlug(request.getSlug())) {
            throw new ApiException("Topic with slug '" + request.getSlug() + "' already exists", HttpStatus.CONFLICT);
        }

        topic.setTitle(request.getTitle());
        topic.setSlug(request.getSlug());
        topic.setDescription(request.getDescription());
        topic.setDifficulty(request.getDifficulty());
        topic.setInternalUnit(request.getInternalUnit());
        topic.setSortOrder(request.getSortOrder());
        topic.setExplanation(request.getExplanation());
        topic.setWhyItMatters(request.getWhyItMatters());
        topic.setSyntax(request.getSyntax());
        topic.setKeyPoints(request.getKeyPoints());
        topic.setCommonMistakes(request.getCommonMistakes());
        topic.setRelatedTopicSlugs(request.getRelatedTopicSlugs());

        if (request.getCodeExamples() != null) {
            List<CodeExample> examples = request.getCodeExamples().stream()
                    .map(dto -> new CodeExample(dto.getTitle(), dto.getCode(), dto.getExplanation()))
                    .collect(Collectors.toList());
            topic.setCodeExamples(examples);
        }

        Topic saved = topicRepository.save(topic);
        return new TopicResponse(saved);
    }

    @CacheEvict(value = {CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_SUMMARIES_CACHE}, allEntries = true)
    @Transactional
    public void deleteTopic(Long id) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));
        topicRepository.delete(topic);
    }

    @Transactional(readOnly = true)
    public long countTopics() {
        return topicRepository.count();
    }
}

