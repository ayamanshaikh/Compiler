package com.codevista.security;

import com.codevista.entity.User;
import com.codevista.entity.UserRole;
import com.codevista.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityHardeningIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private JwtTokenService jwtTokenService;

    private String studentToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        // 1. Create standard student user
        User student = new User(
                "student_sec",
                "student_sec@codevista.ai",
                passwordService.hashPassword("Password123!"),
                UserRole.ROLE_STUDENT
        );
        userRepository.save(student);
        this.studentToken = jwtTokenService.generateToken(student);

        // 2. Create administrator user
        User admin = new User(
                "admin_sec",
                "admin_sec@codevista.ai",
                passwordService.hashPassword("AdminPass123!"),
                UserRole.ROLE_ADMIN
        );
        userRepository.save(admin);
        this.adminToken = jwtTokenService.generateToken(admin);
    }

    @Test
    @DisplayName("Protected user profile requires authentication (HTTP 401)")
    void protectedProfileRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/user/profile")
                        .header("Authorization", "Bearer invalid-garbage-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Admin metrics endpoint rejects student role with HTTP 403 Forbidden")
    void adminEndpointRejectsStudent() throws Exception {
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin metrics endpoint permits authenticated administrator")
    void adminEndpointPermitsAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.compilationEngineStatus", is("HEALTHY")));
    }

    @Test
    @DisplayName("Security response headers are injected on API responses")
    void securityHeadersInjected() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "SAMEORIGIN"))
                .andExpect(header().string("X-XSS-Protection", "1; mode=block"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"));
    }

    @Test
    @DisplayName("Malformed JSON payload yields structured validation error response")
    void malformedPayloadHandledSafely() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{malformed-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").isNotEmpty())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
