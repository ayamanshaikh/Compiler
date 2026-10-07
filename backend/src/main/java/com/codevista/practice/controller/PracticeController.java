package com.codevista.practice.controller;

import com.codevista.entity.Difficulty;
import com.codevista.practice.dto.PracticeQuestionResponse;
import com.codevista.practice.dto.PracticeStatsResponse;
import com.codevista.practice.dto.PracticeSubmitRequest;
import com.codevista.practice.dto.PracticeSubmitResponse;
import com.codevista.practice.entity.QuestionType;
import com.codevista.practice.service.PracticeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/practice")
public class PracticeController {

    private final PracticeService practiceService;

    public PracticeController(PracticeService practiceService) {
        this.practiceService = practiceService;
    }

    @GetMapping("/questions")
    public ResponseEntity<List<PracticeQuestionResponse>> getQuestions(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) QuestionType type
    ) {
        List<PracticeQuestionResponse> questions = practiceService.getQuestions(topic, difficulty, type);
        return ResponseEntity.ok(questions);
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<PracticeQuestionResponse> getQuestionById(@PathVariable Long id) {
        PracticeQuestionResponse question = practiceService.getQuestionById(id);
        return ResponseEntity.ok(question);
    }

    @PostMapping("/submit")
    public ResponseEntity<PracticeSubmitResponse> submitAnswer(@Valid @RequestBody PracticeSubmitRequest request) {
        PracticeSubmitResponse response = practiceService.submitAnswer(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<PracticeStatsResponse> getStats() {
        PracticeStatsResponse stats = practiceService.getStats();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/stats/reset")
    public ResponseEntity<Map<String, String>> resetStats() {
        practiceService.resetStats();
        return ResponseEntity.ok(Map.of("message", "Practice statistics reset successfully"));
    }
}
