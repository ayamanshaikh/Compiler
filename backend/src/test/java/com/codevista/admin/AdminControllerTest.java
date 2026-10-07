package com.codevista.admin;

import com.codevista.entity.User;
import com.codevista.entity.UserRole;
import com.codevista.repository.SystemAuditLogRepository;
import com.codevista.repository.UserRepository;
import com.codevista.security.JwtTokenService;
import com.codevista.security.PasswordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SystemAuditLogRepository auditLogRepository;

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private JwtTokenService jwtTokenService;

    private User studentUser;
    private User instructorUser;
    private User adminUser;

    private String studentToken;
    private String instructorToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        studentUser = new User("test_student", "student@test.com", passwordService.hashPassword("Pass123!"), UserRole.ROLE_STUDENT);
        studentUser = userRepository.save(studentUser);
        studentToken = jwtTokenService.generateToken(studentUser);

        instructorUser = new User("test_instructor", "instructor@test.com", passwordService.hashPassword("Pass123!"), UserRole.ROLE_INSTRUCTOR);
        instructorUser = userRepository.save(instructorUser);
        instructorToken = jwtTokenService.generateToken(instructorUser);

        adminUser = new User("test_admin", "admin@test.com", passwordService.hashPassword("Pass123!"), UserRole.ROLE_ADMIN);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtTokenService.generateToken(adminUser);
    }

    @Test
    @DisplayName("GET /api/admin/metrics returns 401 when unauthenticated")
    void getMetricsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/admin/metrics returns 403 Forbidden for ROLE_STUDENT")
    void getMetricsStudentForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/metrics returns 200 OK for ROLE_INSTRUCTOR")
    void getMetricsInstructorOk() throws Exception {
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + instructorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.heapUsedMb", notNullValue()))
                .andExpect(jsonPath("$.availableProcessors", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.compilationEngineStatus", is("HEALTHY")));
    }

    @Test
    @DisplayName("GET /api/admin/metrics returns 200 OK for ROLE_ADMIN")
    void getMetricsAdminOk() throws Exception {
        mockMvc.perform(get("/api/admin/metrics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.studentsCount", is(1)))
                .andExpect(jsonPath("$.instructorsCount", is(1)))
                .andExpect(jsonPath("$.adminsCount", is(1)));
    }

    @Test
    @DisplayName("GET /api/admin/audit-logs returns 403 for student and 200 for admin")
    void getAuditLogsAccessControl() throws Exception {
        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/admin/users returns list of users for instructor/admin")
    void getUsersOk() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(3)));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/role rejects non-admin, allows admin promotion, disallows self-demotion")
    void updateUserRoleRules() throws Exception {
        String updateToInstructorPayload = "{\"role\":\"ROLE_INSTRUCTOR\"}";

        // Student receives 403
        mockMvc.perform(put("/api/admin/users/" + studentUser.getId() + "/role")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateToInstructorPayload))
                .andExpect(status().isForbidden());

        // Instructor receives 403 (needs super admin)
        mockMvc.perform(put("/api/admin/users/" + studentUser.getId() + "/role")
                        .header("Authorization", "Bearer " + instructorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateToInstructorPayload))
                .andExpect(status().isForbidden());

        // Admin cannot demote self
        String demoteSelfPayload = "{\"role\":\"ROLE_STUDENT\"}";
        mockMvc.perform(put("/api/admin/users/" + adminUser.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(demoteSelfPayload))
                .andExpect(status().isBadRequest());

        // Admin can promote student to instructor
        mockMvc.perform(put("/api/admin/users/" + studentUser.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateToInstructorPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("ROLE_INSTRUCTOR")));
    }

    @Test
    @DisplayName("Topic CMS: CRUD operations, validation and audit logging")
    void topicCmsCrud() throws Exception {
        String newTopicPayload = """
                {
                    "title": "Admin Test Streams",
                    "slug": "admin-test-streams",
                    "description": "Comprehensive explanation of Java Streams API",
                    "difficulty": "INTERMEDIATE",
                    "internalUnit": "Unit 9",
                    "sortOrder": 99,
                    "explanation": "Streams provide functional operations over sequences of elements.",
                    "whyItMatters": "Enables concise and declarative pipeline processing.",
                    "syntax": "list.stream().filter(...).collect(...);",
                    "keyPoints": ["Lazy evaluation", "Terminal operations", "Short-circuiting"],
                    "commonMistakes": ["Reusing a consumed stream", "Mutating shared state"],
                    "relatedTopicSlugs": ["lambdas", "collections"],
                    "codeExamples": [
                        {
                            "title": "Stream Filter Example",
                            "code": "List<String> res = list.stream().filter(s -> s.length() > 3).toList();",
                            "explanation": "Filters strings by length."
                        }
                    ]
                }
                """;

        // Create topic
        String createRes = mockMvc.perform(post("/api/admin/topics")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newTopicPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.slug", is("admin-test-streams")))
                .andExpect(jsonPath("$.title", is("Admin Test Streams")))
                .andReturn().getResponse().getContentAsString();

        Long topicId = Long.parseLong(createRes.split("\"id\":")[1].split(",")[0].trim());

        // Get by ID
        mockMvc.perform(get("/api/admin/topics/" + topicId)
                        .header("Authorization", "Bearer " + instructorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("admin-test-streams")));

        // Update topic
        String updateTopicPayload = """
                {
                    "title": "Admin Test Streams Updated",
                    "slug": "admin-test-streams",
                    "description": "Updated description",
                    "difficulty": "ADVANCED",
                    "internalUnit": "Unit 9",
                    "sortOrder": 100,
                    "explanation": "Updated explanation",
                    "whyItMatters": "Why it matters updated",
                    "syntax": "updated syntax",
                    "keyPoints": ["Updated point"],
                    "commonMistakes": ["Updated mistake"],
                    "relatedTopicSlugs": [],
                    "codeExamples": []
                }
                """;

        mockMvc.perform(put("/api/admin/topics/" + topicId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateTopicPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Admin Test Streams Updated")))
                .andExpect(jsonPath("$.difficulty", is("ADVANCED")));

        // Delete topic
        mockMvc.perform(delete("/api/admin/topics/" + topicId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Get after delete returns 404
        mockMvc.perform(get("/api/admin/topics/" + topicId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Practice CMS: CRUD operations with unmasked admin view and audit logging")
    void practiceQuestionCmsCrud() throws Exception {
        String newQuestionPayload = """
                {
                    "topicSlug": "variables",
                    "questionType": "PREDICT_OUTPUT",
                    "difficulty": "BEGINNER",
                    "title": "CMS Predict Output Question",
                    "prompt": "What does this code output?",
                    "codeSnippet": "int x = 42; System.out.println(x);",
                    "options": ["42", "0", "null", "Compilation error"],
                    "correctAnswer": "42",
                    "expectedOutput": "42",
                    "starterCode": "public class Main { public static void main(String[] args) {} }",
                    "explanation": "The variable x is assigned 42 and printed.",
                    "hint": "Check the value passed to println"
                }
                """;

        // Create question as instructor
        String createRes = mockMvc.perform(post("/api/admin/questions")
                        .header("Authorization", "Bearer " + instructorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newQuestionPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("CMS Predict Output Question")))
                .andExpect(jsonPath("$.correctAnswer", is("42"))) // Admin view has unmasked answer
                .andExpect(jsonPath("$.explanation", is("The variable x is assigned 42 and printed.")))
                .andReturn().getResponse().getContentAsString();

        Long questionId = Long.parseLong(createRes.split("\"id\":")[1].split(",")[0].trim());

        // Get by ID
        mockMvc.perform(get("/api/admin/questions/" + questionId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correctAnswer", is("42")));

        // Update question
        String updateQuestionPayload = """
                {
                    "topicSlug": "variables",
                    "questionType": "PREDICT_OUTPUT",
                    "difficulty": "BEGINNER",
                    "title": "CMS Predict Output Question (Updated)",
                    "prompt": "What does this code output when modified?",
                    "codeSnippet": "int x = 100; System.out.println(x);",
                    "options": ["100", "0", "null", "Compilation error"],
                    "correctAnswer": "100",
                    "expectedOutput": "100",
                    "starterCode": "public class Main { public static void main(String[] args) {} }",
                    "explanation": "The variable x is assigned 100 and printed.",
                    "hint": "Check the value passed to println"
                }
                """;

        mockMvc.perform(put("/api/admin/questions/" + questionId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateQuestionPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("CMS Predict Output Question (Updated)")))
                .andExpect(jsonPath("$.correctAnswer", is("100")));

        // Delete question
        mockMvc.perform(delete("/api/admin/questions/" + questionId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Get after delete returns 404
        mockMvc.perform(get("/api/admin/questions/" + questionId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }
}
