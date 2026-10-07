package com.codevista.admin.controller;

import com.codevista.admin.dto.AdminAuditLogDto;
import com.codevista.admin.dto.AdminMetricsResponse;
import com.codevista.admin.dto.AdminQuestionResponse;
import com.codevista.admin.dto.AdminUserSummaryDto;
import com.codevista.admin.dto.UpdateUserRoleRequest;
import com.codevista.admin.service.AdminMetricsService;
import com.codevista.admin.service.AdminUserService;
import com.codevista.admin.service.AuditLogService;
import com.codevista.dto.TopicCreateRequest;
import com.codevista.dto.TopicResponse;
import com.codevista.dto.TopicSummaryResponse;
import com.codevista.entity.Difficulty;
import com.codevista.entity.User;
import com.codevista.entity.UserRole;
import com.codevista.exception.BadRequestException;
import com.codevista.exception.ResourceNotFoundException;
import com.codevista.practice.dto.PracticeQuestionCreateRequest;
import com.codevista.practice.entity.QuestionType;
import com.codevista.practice.service.PracticeService;
import com.codevista.service.AuthService;
import com.codevista.service.TopicService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuthService authService;
    private final AdminMetricsService metricsService;
    private final AuditLogService auditLogService;
    private final TopicService topicService;
    private final PracticeService practiceService;
    private final AdminUserService adminUserService;

    public AdminController(
            AuthService authService,
            AdminMetricsService metricsService,
            AuditLogService auditLogService,
            TopicService topicService,
            PracticeService practiceService,
            AdminUserService adminUserService
    ) {
        this.authService = authService;
        this.metricsService = metricsService;
        this.auditLogService = auditLogService;
        this.topicService = topicService;
        this.practiceService = practiceService;
        this.adminUserService = adminUserService;
    }

    // --- SYSTEM METRICS & HEALTH ---
    @GetMapping("/metrics")
    public ResponseEntity<AdminMetricsResponse> getMetrics(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        authService.requireAdminOrInstructor(authHeader);
        return ResponseEntity.ok(metricsService.getMetrics());
    }

    // --- AUDIT LOGS ---
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AdminAuditLogDto>> getAuditLogs(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "limit", defaultValue = "50") int limit
    ) {
        authService.requireAdminOrInstructor(authHeader);
        return ResponseEntity.ok(auditLogService.getRecentLogs(limit));
    }

    // --- USER MANAGEMENT ---
    @GetMapping("/users")
    public ResponseEntity<List<AdminUserSummaryDto>> getUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        authService.requireAdminOrInstructor(authHeader);
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<AdminUserSummaryDto> updateUserRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        User admin = authService.requireAdmin(authHeader);
        return ResponseEntity.ok(adminUserService.updateUserRole(id, request, admin));
    }

    // --- TOPIC CMS ---
    @GetMapping("/topics")
    public ResponseEntity<List<TopicSummaryResponse>> getTopics(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) String search
    ) {
        authService.requireAdminOrInstructor(authHeader);
        return ResponseEntity.ok(topicService.getTopics(difficulty, search));
    }

    @GetMapping("/topics/{id}")
    public ResponseEntity<TopicResponse> getTopicById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        authService.requireAdminOrInstructor(authHeader);
        return ResponseEntity.ok(topicService.getTopicById(id));
    }

    @PostMapping("/topics")
    public ResponseEntity<TopicResponse> createTopic(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody TopicCreateRequest request
    ) {
        User admin = authService.requireAdminOrInstructor(authHeader);
        TopicResponse response = topicService.createTopic(request);

        auditLogService.recordLog("TOPIC_CREATED",
                String.format("User '%s' created topic '%s' (slug: %s)",
                        admin.getUsername(), response.getTitle(), response.getSlug()));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/topics/{id}")
    public ResponseEntity<TopicResponse> updateTopic(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody TopicCreateRequest request
    ) {
        User admin = authService.requireAdminOrInstructor(authHeader);
        TopicResponse response = topicService.updateTopic(id, request);

        auditLogService.recordLog("TOPIC_UPDATED",
                String.format("User '%s' updated topic id %d ('%s')",
                        admin.getUsername(), id, response.getTitle()));

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<Void> deleteTopic(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        User admin = authService.requireAdminOrInstructor(authHeader);
        TopicResponse topic = topicService.getTopicById(id);
        topicService.deleteTopic(id);

        auditLogService.recordLog("TOPIC_DELETED",
                String.format("User '%s' deleted topic id %d ('%s')",
                        admin.getUsername(), id, topic.getTitle()));

        return ResponseEntity.noContent().build();
    }

    // --- PRACTICE QUESTION CMS ---
    @GetMapping("/questions")
    public ResponseEntity<List<AdminQuestionResponse>> getQuestions(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "topic", required = false) String topicSlug,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(value = "type", required = false) QuestionType questionType
    ) {
        authService.requireAdminOrInstructor(authHeader);
        return ResponseEntity.ok(practiceService.getAdminQuestions(topicSlug, difficulty, questionType));
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<AdminQuestionResponse> getQuestionById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        authService.requireAdminOrInstructor(authHeader);
        return ResponseEntity.ok(practiceService.getAdminQuestionById(id));
    }

    @PostMapping("/questions")
    public ResponseEntity<AdminQuestionResponse> createQuestion(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody PracticeQuestionCreateRequest request
    ) {
        User admin = authService.requireAdminOrInstructor(authHeader);
        AdminQuestionResponse response = practiceService.createQuestion(request);

        auditLogService.recordLog("QUESTION_CREATED",
                String.format("User '%s' created question '%s' (topic: %s, type: %s)",
                        admin.getUsername(), response.getTitle(), response.getTopicSlug(), response.getQuestionType()));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<AdminQuestionResponse> updateQuestion(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @Valid @RequestBody PracticeQuestionCreateRequest request
    ) {
        User admin = authService.requireAdminOrInstructor(authHeader);
        AdminQuestionResponse response = practiceService.updateQuestion(id, request);

        auditLogService.recordLog("QUESTION_UPDATED",
                String.format("User '%s' updated question id %d ('%s')",
                        admin.getUsername(), id, response.getTitle()));

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Void> deleteQuestion(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        User admin = authService.requireAdminOrInstructor(authHeader);
        AdminQuestionResponse question = practiceService.getAdminQuestionById(id);
        practiceService.deleteQuestion(id);

        auditLogService.recordLog("QUESTION_DELETED",
                String.format("User '%s' deleted question id %d ('%s')",
                        admin.getUsername(), id, question.getTitle()));

        return ResponseEntity.noContent().build();
    }
}
