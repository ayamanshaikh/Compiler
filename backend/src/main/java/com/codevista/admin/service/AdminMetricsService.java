package com.codevista.admin.service;

import com.codevista.admin.dto.AdminMetricsResponse;
import com.codevista.cache.CacheMetricsService;
import com.codevista.cache.CacheMetricsSummary;
import com.codevista.entity.UserRole;
import com.codevista.practice.dto.PracticeStatsResponse;
import com.codevista.practice.repository.PracticeQuestionRepository;
import com.codevista.practice.service.PracticeService;
import com.codevista.repository.TopicRepository;
import com.codevista.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.time.Duration;

@Service
public class AdminMetricsService {

    private final TopicRepository topicRepository;
    private final PracticeQuestionRepository practiceQuestionRepository;
    private final UserRepository userRepository;
    private final PracticeService practiceService;
    private final CacheMetricsService cacheMetricsService;

    public AdminMetricsService(
            TopicRepository topicRepository,
            PracticeQuestionRepository practiceQuestionRepository,
            UserRepository userRepository,
            PracticeService practiceService,
            CacheMetricsService cacheMetricsService
    ) {
        this.topicRepository = topicRepository;
        this.practiceQuestionRepository = practiceQuestionRepository;
        this.userRepository = userRepository;
        this.practiceService = practiceService;
        this.cacheMetricsService = cacheMetricsService;
    }

    @Transactional(readOnly = true)
    public AdminMetricsResponse getMetrics() {
        AdminMetricsResponse response = new AdminMetricsResponse();

        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long maxMemory = runtime.maxMemory();
        long usedMemory = totalMemory - freeMemory;

        response.setHeapTotalBytes(totalMemory);
        response.setHeapFreeBytes(freeMemory);
        response.setHeapMaxBytes(maxMemory);
        response.setHeapUsedBytes(usedMemory);
        response.setHeapUsedMb(Math.round((usedMemory / (1024.0 * 1024.0)) * 10.0) / 10.0);
        response.setHeapMaxMb(Math.round((maxMemory / (1024.0 * 1024.0)) * 10.0) / 10.0);

        long uptimeMillis = ManagementFactory.getRuntimeMXBean().getUptime();
        response.setUptimeMillis(uptimeMillis);
        response.setUptimeFormatted(formatDuration(uptimeMillis));

        response.setAvailableProcessors(runtime.availableProcessors());
        response.setThreadCount(Thread.activeCount());

        response.setTotalTopics(topicRepository.count());
        response.setTotalQuestions(practiceQuestionRepository.count());
        response.setTotalUsers(userRepository.count());
        response.setStudentsCount(userRepository.countByRole(UserRole.ROLE_STUDENT));
        response.setInstructorsCount(userRepository.countByRole(UserRole.ROLE_INSTRUCTOR));
        response.setAdminsCount(userRepository.countByRole(UserRole.ROLE_ADMIN));

        response.setCompilationEngineStatus("HEALTHY");
        response.setCompilationEngineName("OpenJDK 25 Execution Sandbox");

        PracticeStatsResponse guestStats = practiceService.getStats();
        response.setGuestAttempts(guestStats.getTotalAttempts());
        response.setGuestCorrect(guestStats.getCorrectCount());
        response.setGuestIncorrect(guestStats.getIncorrectCount());

        CacheMetricsSummary cacheMetrics = cacheMetricsService.getMetricsSummary();
        response.setTotalCacheEntries(cacheMetrics.totalEntries());
        response.setCacheHits(cacheMetrics.hits());
        response.setCacheMisses(cacheMetrics.misses());
        response.setCacheHitRatio(Math.round(cacheMetrics.hitRatio() * 1000.0) / 10.0);
        response.setCacheEntryCounts(cacheMetrics.cacheEntryCounts());

        return response;
    }

    private String formatDuration(long millis) {
        Duration duration = Duration.ofMillis(millis);
        long days = duration.toDays();
        long hours = duration.toHoursPart();
        long minutes = duration.toMinutesPart();
        long seconds = duration.toSecondsPart();

        if (days > 0) {
            return String.format("%dd %dh %dm", days, hours, minutes);
        } else if (hours > 0) {
            return String.format("%dh %dm %ds", hours, minutes, seconds);
        } else if (minutes > 0) {
            return String.format("%dm %ds", minutes, seconds);
        } else {
            return String.format("%ds", seconds);
        }
    }
}
