package com.codevista.service;

import com.codevista.dto.BookmarkAlgorithmRequest;
import com.codevista.dto.QuestionProgressRequest;
import com.codevista.dto.SaveSnippetRequest;
import com.codevista.dto.SavedSnippetDto;
import com.codevista.dto.TopicProgressRequest;
import com.codevista.dto.UpdatePasswordRequest;
import com.codevista.dto.UserPreferencesDto;
import com.codevista.dto.UserProfileResponse;
import com.codevista.dto.UserProgressDto;
import com.codevista.entity.SavedSnippet;
import com.codevista.entity.User;
import com.codevista.entity.UserPreferences;
import com.codevista.entity.UserProgress;
import com.codevista.exception.BadRequestException;
import com.codevista.exception.ResourceNotFoundException;
import com.codevista.repository.SavedSnippetRepository;
import com.codevista.repository.UserPreferencesRepository;
import com.codevista.repository.UserProgressRepository;
import com.codevista.repository.UserRepository;
import com.codevista.security.PasswordService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final UserProgressRepository progressRepository;
    private final SavedSnippetRepository snippetRepository;
    private final PasswordService passwordService;
    private final AuthService authService;

    public UserService(
            UserRepository userRepository,
            UserPreferencesRepository preferencesRepository,
            UserProgressRepository progressRepository,
            SavedSnippetRepository snippetRepository,
            PasswordService passwordService,
            AuthService authService
    ) {
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
        this.progressRepository = progressRepository;
        this.snippetRepository = snippetRepository;
        this.passwordService = passwordService;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(User user) {
        UserPreferences preferences = preferencesRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserPreferences(user));

        UserProgress progress = progressRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserProgress(user));

        List<SavedSnippet> snippets = snippetRepository.findByUserIdOrderByUpdatedAtDesc(user.getId());

        return new UserProfileResponse(
                authService.toSummaryDto(user),
                UserPreferencesDto.fromEntity(preferences),
                UserProgressDto.fromEntity(progress),
                snippets.size()
        );
    }

    @Transactional
    public UserPreferencesDto updatePreferences(User user, UserPreferencesDto dto) {
        UserPreferences preferences = preferencesRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserPreferences newPref = new UserPreferences(user);
                    return preferencesRepository.save(newPref);
                });

        if (dto.theme() != null) {
            String theme = dto.theme().toLowerCase();
            if (theme.equals("dark") || theme.equals("light") || theme.equals("system")) {
                preferences.setTheme(theme);
            }
        }
        if (dto.fontSize() != null && dto.fontSize() >= 10 && dto.fontSize() <= 32) {
            preferences.setFontSize(dto.fontSize());
        }
        if (dto.tabSize() != null && (dto.tabSize() == 2 || dto.tabSize() == 4)) {
            preferences.setTabSize(dto.tabSize());
        }
        if (dto.explanationDepth() != null) {
            String depth = dto.explanationDepth().toUpperCase();
            if (depth.equals("BEGINNER") || depth.equals("STANDARD") || depth.equals("DETAILED")) {
                preferences.setExplanationDepth(depth);
            }
        }
        if (dto.autoRunEnabled() != null) {
            preferences.setAutoRunEnabled(dto.autoRunEnabled());
        }
        if (dto.visualizerSpeed() != null && dto.visualizerSpeed() >= 100 && dto.visualizerSpeed() <= 3000) {
            preferences.setVisualizerSpeed(dto.visualizerSpeed());
        }
        if (dto.accent() != null) {
            String accent = dto.accent().toLowerCase();
            if (accent.equals("emerald") || accent.equals("indigo") || accent.equals("cyan") || accent.equals("amber") || accent.equals("rose")) {
                preferences.setAccent(accent);
            }
        }
        if (dto.animationMode() != null) {
            String mode = dto.animationMode().toLowerCase();
            if (mode.equals("professional") || mode.equals("balanced") || mode.equals("enhanced")) {
                preferences.setAnimationMode(mode);
            }
        }
        if (dto.lineWrapping() != null) {
            preferences.setLineWrapping(dto.lineWrapping());
        }
        if (dto.minimap() != null) {
            preferences.setMinimap(dto.minimap());
        }
        if (dto.visualizationDetail() != null) {
            String detail = dto.visualizationDetail().toLowerCase();
            if (detail.equals("compact") || detail.equals("standard") || detail.equals("detailed")) {
                preferences.setVisualizationDetail(detail);
            }
        }
        if (dto.visualDensity() != null) {
            String density = dto.visualDensity().toLowerCase();
            if (density.equals("compact") || density.equals("comfortable")) {
                preferences.setVisualDensity(density);
            }
        }

        UserPreferences saved = preferencesRepository.save(preferences);
        return UserPreferencesDto.fromEntity(saved);
    }

    @Transactional
    public UserProfileResponse updateTopicProgress(User user, TopicProgressRequest request) {
        UserProgress progress = progressRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProgress newProgress = new UserProgress(user);
                    return progressRepository.save(newProgress);
                });

        if (request.isCompleted()) {
            progress.getCompletedTopics().add(request.getTopicSlug());
        } else {
            progress.getCompletedTopics().remove(request.getTopicSlug());
        }
        progress.setLastActiveAt(Instant.now());
        progressRepository.save(progress);

        return getProfile(user);
    }

    @Transactional
    public UserProfileResponse updateQuestionProgress(User user, QuestionProgressRequest request) {
        UserProgress progress = progressRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProgress newProgress = new UserProgress(user);
                    return progressRepository.save(newProgress);
                });

        if (request.isSolved()) {
            progress.getSolvedQuestions().add(request.getQuestionId());
        } else {
            progress.getSolvedQuestions().remove(request.getQuestionId());
        }
        progress.setLastActiveAt(Instant.now());
        progressRepository.save(progress);

        return getProfile(user);
    }

    @Transactional
    public UserProfileResponse updateAlgorithmBookmark(User user, BookmarkAlgorithmRequest request) {
        UserProgress progress = progressRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProgress newProgress = new UserProgress(user);
                    return progressRepository.save(newProgress);
                });

        if (request.isBookmarked()) {
            progress.getBookmarkedAlgorithms().add(request.getAlgorithmId());
        } else {
            progress.getBookmarkedAlgorithms().remove(request.getAlgorithmId());
        }
        progress.setLastActiveAt(Instant.now());
        progressRepository.save(progress);

        return getProfile(user);
    }

    @Transactional
    public SavedSnippetDto saveSnippet(User user, SaveSnippetRequest request) {
        SavedSnippet snippet = new SavedSnippet(
                user,
                request.getTitle().trim(),
                request.getCode(),
                request.getDescription() != null ? request.getDescription().trim() : null
        );
        SavedSnippet saved = snippetRepository.save(snippet);
        return SavedSnippetDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<SavedSnippetDto> getSavedSnippets(User user) {
        return snippetRepository.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(SavedSnippetDto::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteSnippet(User user, Long snippetId) {
        SavedSnippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new ResourceNotFoundException("Snippet not found with id: " + snippetId));

        if (!snippet.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You do not own this snippet");
        }

        snippetRepository.delete(snippet);
    }

    @Transactional
    public void changePassword(User user, UpdatePasswordRequest request) {
        if (!passwordService.verifyPassword(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password does not match");
        }

        user.setPasswordHash(passwordService.hashPassword(request.getNewPassword()));
        userRepository.save(user);
    }
}
