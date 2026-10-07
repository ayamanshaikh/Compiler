package com.codevista.practice.service;

import com.codevista.compiler.model.CompilerDiagnostic;
import com.codevista.compiler.model.Language;
import com.codevista.config.CacheConfig;
import com.codevista.entity.Difficulty;
import com.codevista.exception.ResourceNotFoundException;
import com.codevista.execution.adapter.JavaProcessExecutor;
import com.codevista.execution.model.ExecutionRequest;
import com.codevista.execution.model.ExecutionResult;
import com.codevista.admin.dto.AdminQuestionResponse;
import com.codevista.practice.dto.PracticeQuestionCreateRequest;
import com.codevista.practice.dto.PracticeQuestionResponse;
import com.codevista.practice.dto.PracticeStatsResponse;
import com.codevista.practice.dto.PracticeStatsResponse.PerformanceMetric;
import com.codevista.practice.dto.PracticeSubmitRequest;
import com.codevista.practice.dto.PracticeSubmitResponse;
import com.codevista.practice.entity.PracticeQuestion;
import com.codevista.practice.entity.QuestionType;
import com.codevista.practice.repository.PracticeQuestionRepository;
import com.codevista.repository.TopicRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
public class PracticeService {

    private final PracticeQuestionRepository questionRepository;
    private final JavaProcessExecutor javaProcessExecutor;

    // In-memory guest practice metrics tracking
    private final AtomicInteger totalAttempts = new AtomicInteger(0);
    private final AtomicInteger totalCorrect = new AtomicInteger(0);
    private final AtomicInteger totalIncorrect = new AtomicInteger(0);

    // Topic performance: attempts and correct counts
    private final Map<String, int[]> topicPerformance = new ConcurrentHashMap<>();
    // Difficulty performance: attempts and correct counts
    private final Map<String, int[]> difficultyPerformance = new ConcurrentHashMap<>();

    private final TopicRepository topicRepository;

    public PracticeService(
            PracticeQuestionRepository questionRepository,
            JavaProcessExecutor javaProcessExecutor,
            TopicRepository topicRepository
    ) {
        this.questionRepository = questionRepository;
        this.javaProcessExecutor = javaProcessExecutor;
        this.topicRepository = topicRepository;
    }

    @Cacheable(value = CacheConfig.PRACTICE_QUESTIONS_CACHE, key = "(#topicSlug != null ? #topicSlug : 'ALL') + ':' + (#difficulty != null ? #difficulty.name() : 'ALL') + ':' + (#questionType != null ? #questionType.name() : 'ALL')")
    @Transactional(readOnly = true)
    public List<PracticeQuestionResponse> getQuestions(String topicSlug, Difficulty difficulty, QuestionType questionType) {
        List<PracticeQuestion> questions = questionRepository.findWithFilters(topicSlug, difficulty, questionType);
        return questions.stream()
                .map(PracticeQuestionResponse::new)
                .collect(Collectors.toList());
    }

    @Cacheable(value = CacheConfig.PRACTICE_QUESTIONS_CACHE, key = "#id")
    @Transactional(readOnly = true)
    public PracticeQuestionResponse getQuestionById(Long id) {
        PracticeQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Practice question not found with id: " + id));
        return new PracticeQuestionResponse(question);
    }

    @Transactional
    public PracticeSubmitResponse submitAnswer(PracticeSubmitRequest request) {
        PracticeQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Practice question not found with id: " + request.getQuestionId()));

        boolean isCorrect = false;
        String compilerOutput = null;
        String compilerStatus = null;
        List<String> diagnosticsList = new ArrayList<>();
        String feedback;

        QuestionType qType = question.getQuestionType();

        // 1. Code execution questions: evaluate with real OpenJDK JavaProcessExecutor
        if (qType == QuestionType.WRITE_CODE || qType == QuestionType.FIX_CODE ||
                qType == QuestionType.DEBUG_CODE || qType == QuestionType.ALGORITHM) {

            String codeToRun = request.getSourceCode() != null && !request.getSourceCode().isBlank()
                    ? request.getSourceCode()
                    : request.getUserAnswer();

            if (codeToRun == null || codeToRun.isBlank()) {
                feedback = "No code was submitted. Please write or fix the solution.";
                compilerStatus = "EMPTY_CODE";
            } else {
                ExecutionResult execResult = javaProcessExecutor.execute(
                        new ExecutionRequest(Language.JAVA, codeToRun, "", null)
                );
                compilerStatus = execResult.getStatus().name();
                compilerOutput = execResult.getOutput();

                for (CompilerDiagnostic diag : execResult.getDiagnostics()) {
                    diagnosticsList.add("Line " + diag.getLine() + ": " + diag.getMessage());
                }

                if (execResult.isSuccess()) {
                    String actualOut = execResult.getOutput().trim();
                    String expectedOut = question.getExpectedOutput() != null ? question.getExpectedOutput().trim() : "";

                    if (expectedOut.isEmpty() || actualOut.equals(expectedOut)) {
                        isCorrect = true;
                        feedback = "Excellent! Your code compiled and produced the exact expected output.";
                    } else {
                        isCorrect = false;
                        feedback = "Code compiled and ran, but output did not match expected output.\nExpected: [" +
                                expectedOut + "]\nActual: [" + actualOut + "]";
                    }
                } else {
                    isCorrect = false;
                    feedback = "Compilation or runtime failure: " + (execResult.getRuntimeError().isBlank()
                            ? "Check compiler diagnostics"
                            : execResult.getRuntimeError());
                }
            }
        }
        // 2. Choice / Text questions (MCQ, PREDICT_OUTPUT, FIND_ERROR, MATCH_CONCEPT)
        else {
            String userAnswer = request.getUserAnswer() != null ? request.getUserAnswer().trim() : "";
            String correctAnswer = question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";

            // Compare case-insensitively or exact match
            if (userAnswer.equalsIgnoreCase(correctAnswer)) {
                isCorrect = true;
                feedback = "Correct! Well done.";
            } else {
                // If question options are e.g. "A", "B", "C", "D" check prefix or value match
                boolean matchesOptionText = false;
                if (question.getOptions() != null) {
                    for (int i = 0; i < question.getOptions().size(); i++) {
                        String opt = question.getOptions().get(i).trim();
                        char letter = (char) ('A' + i);
                        if (userAnswer.equalsIgnoreCase(String.valueOf(letter)) &&
                                (correctAnswer.equalsIgnoreCase(String.valueOf(letter)) || correctAnswer.equalsIgnoreCase(opt))) {
                            matchesOptionText = true;
                            break;
                        }
                    }
                }

                if (matchesOptionText) {
                    isCorrect = true;
                    feedback = "Correct! Well done.";
                } else {
                    isCorrect = false;
                    feedback = "Not quite right. Review the explanation below.";
                }
            }
        }

        // Update tracking metrics
        recordMetrics(question.getTopicSlug(), question.getDifficulty().name(), isCorrect);

        PracticeSubmitResponse response = new PracticeSubmitResponse(
                question.getId(),
                isCorrect,
                request.getUserAnswer(),
                question.getCorrectAnswer(),
                question.getExplanation(),
                feedback
        );
        response.setCompilerOutput(compilerOutput);
        response.setCompilerStatus(compilerStatus);
        response.setCompilerDiagnostics(diagnosticsList);

        return response;
    }

    private void recordMetrics(String topicSlug, String difficultyName, boolean isCorrect) {
        totalAttempts.incrementAndGet();
        if (isCorrect) {
            totalCorrect.incrementAndGet();
        } else {
            totalIncorrect.incrementAndGet();
        }

        // Topic performance tracking: [attempts, correct]
        topicPerformance.compute(topicSlug, (k, v) -> {
            if (v == null) v = new int[]{0, 0};
            v[0]++;
            if (isCorrect) v[1]++;
            return v;
        });

        // Difficulty performance tracking: [attempts, correct]
        difficultyPerformance.compute(difficultyName, (k, v) -> {
            if (v == null) v = new int[]{0, 0};
            v[0]++;
            if (isCorrect) v[1]++;
            return v;
        });
    }

    public PracticeStatsResponse getStats() {
        Map<String, PerformanceMetric> topicMetrics = new HashMap<>();
        topicPerformance.forEach((k, v) -> topicMetrics.put(k, new PerformanceMetric(v[0], v[1])));

        Map<String, PerformanceMetric> diffMetrics = new HashMap<>();
        difficultyPerformance.forEach((k, v) -> diffMetrics.put(k, new PerformanceMetric(v[0], v[1])));

        return new PracticeStatsResponse(
                totalAttempts.get(),
                totalCorrect.get(),
                totalIncorrect.get(),
                topicMetrics,
                diffMetrics
        );
    }

    public void resetStats() {
        totalAttempts.set(0);
        totalCorrect.set(0);
        totalIncorrect.set(0);
        topicPerformance.clear();
        difficultyPerformance.clear();
    }

    @Transactional(readOnly = true)
    public List<AdminQuestionResponse> getAdminQuestions(String topicSlug, Difficulty difficulty, QuestionType questionType) {
        List<PracticeQuestion> questions = questionRepository.findWithFilters(topicSlug, difficulty, questionType);
        return questions.stream()
                .map(AdminQuestionResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminQuestionResponse getAdminQuestionById(Long id) {
        PracticeQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Practice question not found with id: " + id));
        return new AdminQuestionResponse(question);
    }

    @CacheEvict(value = {CacheConfig.PRACTICE_QUESTIONS_CACHE, CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_SUMMARIES_CACHE}, allEntries = true)
    @Transactional
    public AdminQuestionResponse createQuestion(PracticeQuestionCreateRequest request) {
        PracticeQuestion question = new PracticeQuestion(
                request.getTopicSlug(),
                request.getQuestionType(),
                request.getDifficulty(),
                request.getTitle(),
                request.getPrompt(),
                request.getCorrectAnswer(),
                request.getExplanation()
        );
        question.setCodeSnippet(request.getCodeSnippet());
        question.setOptions(request.getOptions());
        question.setExpectedOutput(request.getExpectedOutput());
        question.setStarterCode(request.getStarterCode());
        question.setHint(request.getHint());

        PracticeQuestion saved = questionRepository.save(question);
        updateTopicQuestionCount(saved.getTopicSlug());
        return new AdminQuestionResponse(saved);
    }

    @CacheEvict(value = {CacheConfig.PRACTICE_QUESTIONS_CACHE, CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_SUMMARIES_CACHE}, allEntries = true)
    @Transactional
    public AdminQuestionResponse updateQuestion(Long id, PracticeQuestionCreateRequest request) {
        PracticeQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Practice question not found with id: " + id));

        String oldTopicSlug = question.getTopicSlug();

        question.setTopicSlug(request.getTopicSlug());
        question.setQuestionType(request.getQuestionType());
        question.setDifficulty(request.getDifficulty());
        question.setTitle(request.getTitle());
        question.setPrompt(request.getPrompt());
        question.setCodeSnippet(request.getCodeSnippet());
        question.setOptions(request.getOptions());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setExpectedOutput(request.getExpectedOutput());
        question.setStarterCode(request.getStarterCode());
        question.setExplanation(request.getExplanation());
        question.setHint(request.getHint());

        PracticeQuestion saved = questionRepository.save(question);

        if (!oldTopicSlug.equalsIgnoreCase(saved.getTopicSlug())) {
            updateTopicQuestionCount(oldTopicSlug);
        }
        updateTopicQuestionCount(saved.getTopicSlug());

        return new AdminQuestionResponse(saved);
    }

    @CacheEvict(value = {CacheConfig.PRACTICE_QUESTIONS_CACHE, CacheConfig.TOPICS_CACHE, CacheConfig.TOPIC_SUMMARIES_CACHE}, allEntries = true)
    @Transactional
    public void deleteQuestion(Long id) {
        PracticeQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Practice question not found with id: " + id));
        String topicSlug = question.getTopicSlug();
        questionRepository.delete(question);
        updateTopicQuestionCount(topicSlug);
    }

    @Transactional(readOnly = true)
    public long countQuestions() {
        return questionRepository.count();
    }

    private void updateTopicQuestionCount(String topicSlug) {
        if (topicSlug != null && topicRepository != null) {
            topicRepository.findBySlug(topicSlug).ifPresent(topic -> {
                topic.setPracticeQuestionCount((int) questionRepository.countByTopicSlug(topicSlug));
                topicRepository.save(topic);
            });
        }
    }
}
