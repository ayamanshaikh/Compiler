package com.codevista.controller;

import com.codevista.dto.TopicCreateRequest;
import com.codevista.dto.TopicResponse;
import com.codevista.dto.TopicSummaryResponse;
import com.codevista.entity.Difficulty;
import com.codevista.service.TopicService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/topics")
public class TopicController {

    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping
    public ResponseEntity<List<TopicSummaryResponse>> getTopics(
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "order") String sortBy
    ) {
        List<TopicSummaryResponse> topics = topicService.getTopics(difficulty, search, sortBy);
        return ResponseEntity.ok(topics);
    }

    @GetMapping("/search")
    public ResponseEntity<List<TopicSummaryResponse>> searchTopics(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Difficulty difficulty
    ) {
        List<TopicSummaryResponse> topics = topicService.searchTopics(q, difficulty);
        return ResponseEntity.ok(topics);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<TopicResponse> getTopicBySlug(@PathVariable String slug) {
        TopicResponse topic = topicService.getTopicBySlug(slug);
        return ResponseEntity.ok(topic);
    }

    @PostMapping
    public ResponseEntity<TopicResponse> createTopic(@Valid @RequestBody TopicCreateRequest request) {
        TopicResponse created = topicService.createTopic(request);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{slug}")
                .buildAndExpand(created.getSlug())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }
}

