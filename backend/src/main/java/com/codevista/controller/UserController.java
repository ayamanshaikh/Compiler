package com.codevista.controller;

import com.codevista.dto.BookmarkAlgorithmRequest;
import com.codevista.dto.QuestionProgressRequest;
import com.codevista.dto.SaveSnippetRequest;
import com.codevista.dto.SavedSnippetDto;
import com.codevista.dto.TopicProgressRequest;
import com.codevista.dto.UpdatePasswordRequest;
import com.codevista.dto.UserPreferencesDto;
import com.codevista.dto.UserProfileResponse;
import com.codevista.entity.User;
import com.codevista.service.AuthService;
import com.codevista.service.UserService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        User user = authService.getCurrentUser(authHeader);
        return ResponseEntity.ok(userService.getProfile(user));
    }

    @PutMapping("/preferences")
    public ResponseEntity<UserPreferencesDto> updatePreferences(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UserPreferencesDto dto
    ) {
        User user = authService.getCurrentUser(authHeader);
        return ResponseEntity.ok(userService.updatePreferences(user, dto));
    }

    @PostMapping("/progress/topic")
    public ResponseEntity<UserProfileResponse> updateTopicProgress(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody TopicProgressRequest request
    ) {
        User user = authService.getCurrentUser(authHeader);
        return ResponseEntity.ok(userService.updateTopicProgress(user, request));
    }

    @PostMapping("/progress/question")
    public ResponseEntity<UserProfileResponse> updateQuestionProgress(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody QuestionProgressRequest request
    ) {
        User user = authService.getCurrentUser(authHeader);
        return ResponseEntity.ok(userService.updateQuestionProgress(user, request));
    }

    @PostMapping("/progress/algorithm")
    public ResponseEntity<UserProfileResponse> updateAlgorithmBookmark(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody BookmarkAlgorithmRequest request
    ) {
        User user = authService.getCurrentUser(authHeader);
        return ResponseEntity.ok(userService.updateAlgorithmBookmark(user, request));
    }

    @GetMapping("/snippets")
    public ResponseEntity<List<SavedSnippetDto>> getSnippets(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        User user = authService.getCurrentUser(authHeader);
        return ResponseEntity.ok(userService.getSavedSnippets(user));
    }

    @PostMapping("/snippets")
    public ResponseEntity<SavedSnippetDto> saveSnippet(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody SaveSnippetRequest request
    ) {
        User user = authService.getCurrentUser(authHeader);
        SavedSnippetDto snippet = userService.saveSnippet(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(snippet);
    }

    @DeleteMapping("/snippets/{id}")
    public ResponseEntity<Void> deleteSnippet(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        User user = authService.getCurrentUser(authHeader);
        userService.deleteSnippet(user, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody UpdatePasswordRequest request
    ) {
        User user = authService.getCurrentUser(authHeader);
        userService.changePassword(user, request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
