package com.codevista.integration;

import com.codevista.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EndToEndUserJourneyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Complete end-to-end journey: Register -> Login -> Customize -> Learn -> Practice -> Execute -> Trace -> Profile Sync")
    void completeEndToEndUserJourney() throws Exception {
        // 1. User Registration
        String regPayload = """
                {
                    "username": "e2e_student",
                    "email": "e2e_student@codevista.ai",
                    "password": "SecurePassword123!"
                }
                """;

        String regResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username", is("e2e_student")))
                .andReturn().getResponse().getContentAsString();

        // 2. User Authentication (Login)
        String loginPayload = """
                {
                    "usernameOrEmail": "e2e_student",
                    "password": "SecurePassword123!"
                }
                """;

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String token = loginResponse.split("\"token\":\"")[1].split("\"")[0];
        String authHeader = "Bearer " + token;

        // 3. User Customization Preferences (Theme, Accent, Motion Mode, Monaco Typography)
        String prefPayload = """
                {
                    "theme": "dark",
                    "accent": "indigo",
                    "animationMode": "enhanced",
                    "fontSize": 16,
                    "tabSize": 2,
                    "lineWrapping": false,
                    "minimap": true,
                    "explanationDepth": "DETAILED",
                    "autoRunEnabled": true,
                    "visualizerSpeed": 400,
                    "visualizationDetail": "detailed",
                    "visualDensity": "compact"
                }
                """;

        mockMvc.perform(put("/api/user/preferences")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(prefPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accent", is("indigo")))
                .andExpect(jsonPath("$.animationMode", is("enhanced")))
                .andExpect(jsonPath("$.fontSize", is(16)))
                .andExpect(jsonPath("$.tabSize", is(2)))
                .andExpect(jsonPath("$.lineWrapping", is(false)))
                .andExpect(jsonPath("$.minimap", is(true)))
                .andExpect(jsonPath("$.visualizationDetail", is("detailed")))
                .andExpect(jsonPath("$.visualDensity", is("compact")));

        // 4. Curriculum Exploration & Topic Progress
        mockMvc.perform(get("/api/topics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));

        mockMvc.perform(post("/api/user/progress/topic")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topicSlug\": \"classes-and-objects\", \"completed\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progress.completedTopics", hasItem("classes-and-objects")))
                .andExpect(jsonPath("$.progress.completedTopicsCount", is(1)));

        // 5. Practice Arena Exploration & Answer Submission
        mockMvc.perform(get("/api/practice/questions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))));

        mockMvc.perform(post("/api/user/progress/question")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"questionId\": \"1\", \"solved\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progress.solvedQuestions", hasItem("1")))
                .andExpect(jsonPath("$.progress.solvedQuestionsCount", is(1)));

        // 6. Real Java Process Execution (JDK 25 Subprocess)
        String executePayload = """
                {
                    "language": "JAVA",
                    "sourceCode": "public class Main { public static void main(String[] args) { System.out.println(\\\"E2E_OK_42\\\"); } }"
                }
                """;

        mockMvc.perform(post("/api/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(executePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.output", containsString("E2E_OK_42")))
                .andExpect(jsonPath("$.exitCode", is(0)));

        // 7. JVM Execution Step Tracing
        String tracePayload = """
                {
                    "language": "JAVA",
                    "sourceCode": "public class Main { public static void main(String[] args) { int x = 100; int y = 200; System.out.println(x + y); } }"
                }
                """;

        mockMvc.perform(post("/api/trace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tracePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.steps", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.steps[0].line").isNumber());

        // 8. Algorithm Bookmark
        mockMvc.perform(post("/api/user/progress/algorithm")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"algorithmId\": \"binary-search\", \"bookmarked\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progress.bookmarkedAlgorithms", hasItem("binary-search")))
                .andExpect(jsonPath("$.progress.bookmarkedAlgorithmsCount", is(1)));

        // 9. Profile Verification: All aspects integrated and verified
        mockMvc.perform(get("/api/user/profile")
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username", is("e2e_student")))
                .andExpect(jsonPath("$.preferences.accent", is("indigo")))
                .andExpect(jsonPath("$.preferences.animationMode", is("enhanced")))
                .andExpect(jsonPath("$.preferences.lineWrapping", is(false)))
                .andExpect(jsonPath("$.preferences.minimap", is(true)))
                .andExpect(jsonPath("$.progress.completedTopics", hasItem("classes-and-objects")))
                .andExpect(jsonPath("$.progress.solvedQuestions", hasItem("1")))
                .andExpect(jsonPath("$.progress.bookmarkedAlgorithms", hasItem("binary-search")));
    }
}
