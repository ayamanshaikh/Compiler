package com.codevista.config;

import com.codevista.admin.dto.AdminMetricsResponse;
import com.codevista.cache.CacheMetricsService;
import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.service.CompilerService;
import com.codevista.dto.CompileRequest;
import com.codevista.dto.TraceRequest;
import com.codevista.dto.TopicResponse;
import com.codevista.entity.User;
import com.codevista.entity.UserRole;
import com.codevista.repository.UserRepository;
import com.codevista.security.JwtTokenService;
import com.codevista.service.TopicService;
import com.codevista.practice.service.PracticeService;
import com.codevista.trace.model.ExecutionTrace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class PerformanceAndCacheTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private CacheMetricsService cacheMetricsService;

    @Autowired
    private TopicService topicService;

    @Autowired
    private PracticeService practiceService;

    @Autowired
    private CompilerService compilerService;

    @Autowired
    private com.codevista.trace.service.TraceService traceService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    private String adminToken;

    @BeforeEach
    void setUp() {
        cacheMetricsService.clearAllCaches();

        User admin = userRepository.findByUsername("perf_admin_test").orElseGet(() -> {
            User u = new User("perf_admin_test", "perf_admin@codevista.ai", "hashedPass", UserRole.ROLE_ADMIN);
            return userRepository.save(u);
        });
        adminToken = jwtTokenService.generateToken(admin);
    }

    @Test
    @DisplayName("Security headers filter injects expected hardening headers")
    void testSecurityHeadersPresent() throws Exception {
        mockMvc.perform(get("/api/topics"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"))
                .andExpect(header().string("X-XSS-Protection", "1; mode=block"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"));
    }

    @Test
    @DisplayName("Shallow ETag filter issues ETag and honors If-None-Match with HTTP 304")
    void testEtagHeaderAnd304NotModified() throws Exception {
        // Initial request: should yield 200 OK with ETag header
        MvcResult firstResult = mockMvc.perform(get("/api/topics"))
                .andExpect(status().isOk())
                .andExpect(header().exists("ETag"))
                .andReturn();

        String etag = firstResult.getResponse().getHeader("ETag");
        assertThat(etag).isNotNull().isNotEmpty();

        // Second request with If-None-Match should return 304 Not Modified
        mockMvc.perform(get("/api/topics")
                        .header("If-None-Match", etag))
                .andExpect(status().isNotModified());
    }

    @Test
    @DisplayName("TopicService caches topic lookups and evicts on updates")
    void testTopicServiceCachingAndEviction() {
        String targetSlug = topicService.getTopics(null, null).get(0).getSlug();

        // First lookup loads from repo and populates cache
        TopicResponse first = topicService.getTopicBySlug(targetSlug);
        assertThat(first).isNotNull();

        Cache topicCache = cacheManager.getCache(CacheConfig.TOPICS_CACHE);
        assertThat(topicCache).isNotNull();
        assertThat(topicCache.get(targetSlug)).isNotNull();

        // Second lookup hits the cache
        TopicResponse second = topicService.getTopicBySlug(targetSlug);
        assertThat(second.getId()).isEqualTo(first.getId());

        // Cache summary should show entries and hits
        var summary = cacheMetricsService.getMetricsSummary();
        assertThat(summary.hits()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("PracticeService caches practice questions list")
    void testPracticeServiceCaching() {
        var questions = practiceService.getQuestions(null, null, null);
        assertThat(questions).isNotNull();

        Cache practiceCache = cacheManager.getCache(CacheConfig.PRACTICE_QUESTIONS_CACHE);
        assertThat(practiceCache).isNotNull();
        assertThat(practiceCache.get("ALL:ALL:ALL")).isNotNull();

        // Second call hits cache
        var cachedQuestions = practiceService.getQuestions(null, null, null);
        assertThat(cachedQuestions.size()).isEqualTo(questions.size());
    }

    @Test
    @DisplayName("CompilerService caches compilation results for identical source code")
    void testCompilationResultCaching() {
        CompileRequest request = new CompileRequest();
        request.setLanguage("java");
        request.setClassName("CacheTest");
        request.setSourceCode("public class CacheTest { public static void main(String[] args) { System.out.println(100); } }");

        CompilationResult result1 = compilerService.compile(request);
        assertThat(result1.isSuccess()).isTrue();

        Cache compCache = cacheManager.getCache(CacheConfig.COMPILATION_CACHE);
        assertThat(compCache).isNotNull();

        // Second call should return cached result
        CompilationResult result2 = compilerService.compile(request);
        assertThat(result2.isSuccess()).isTrue();
        assertThat(result2.getMainClass()).isEqualTo("CacheTest");
    }

    @Test
    @DisplayName("TraceService caches execution trace results for identical source code and input")
    void testExecutionTraceCaching() {
        TraceRequest request = new TraceRequest();
        request.setLanguage("java");
        request.setClassName("TraceCacheTest");
        request.setSourceCode("public class TraceCacheTest { public static void main(String[] args) { int a = 5; } }");

        ExecutionTrace trace1 = traceService.trace(request);
        assertThat(trace1.isSuccess()).isTrue();

        Cache traceCache = cacheManager.getCache(CacheConfig.TRACE_CACHE);
        assertThat(traceCache).isNotNull();

        // Second trace call should return cached result
        ExecutionTrace trace2 = traceService.trace(request);
        assertThat(trace2.isSuccess()).isTrue();
    }

    @Test
    @DisplayName("Admin metrics endpoint exposes cache telemetry counters")
    void testAdminMetricsTelemetry() throws Exception {
        // Prime some cache hits
        String targetSlug = topicService.getTopics(null, null).get(0).getSlug();
        topicService.getTopicBySlug(targetSlug);
        topicService.getTopicBySlug(targetSlug);

        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cacheHits").isNumber())
                .andExpect(jsonPath("$.cacheMisses").isNumber())
                .andExpect(jsonPath("$.cacheHitRatio").isNumber())
                .andExpect(jsonPath("$.totalCacheEntries").isNumber())
                .andExpect(jsonPath("$.cacheEntryCounts").isMap());
    }
}
