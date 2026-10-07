package com.codevista.controller;

import com.codevista.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    private String authToken;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();

        String regPayload = """
                {
                    "username": "profile_tester",
                    "email": "profile@codevista.ai",
                    "password": "InitialPassword123!"
                }
                """;

        String res = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        this.authToken = res.split("\"token\":\"")[1].split("\"")[0];
    }

    @Test
    @DisplayName("GET /api/user/profile returns profile, preferences, and progress")
    void getProfileSuccess() throws Exception {
        mockMvc.perform(get("/api/user/profile")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.username", is("profile_tester")))
                .andExpect(jsonPath("$.preferences.theme", is("dark")))
                .andExpect(jsonPath("$.preferences.fontSize", is(14)))
                .andExpect(jsonPath("$.progress.completedTopicsCount", is(0)));
    }

    @Test
    @DisplayName("PUT /api/user/preferences updates user settings")
    void updatePreferencesSuccess() throws Exception {
        String prefPayload = """
                {
                    "theme": "light",
                    "fontSize": 16,
                    "tabSize": 2,
                    "explanationDepth": "DETAILED",
                    "autoRunEnabled": true,
                    "visualizerSpeed": 800
                }
                """;

        mockMvc.perform(put("/api/user/preferences")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(prefPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.theme", is("light")))
                .andExpect(jsonPath("$.fontSize", is(16)))
                .andExpect(jsonPath("$.tabSize", is(2)))
                .andExpect(jsonPath("$.explanationDepth", is("DETAILED")))
                .andExpect(jsonPath("$.autoRunEnabled", is(true)))
                .andExpect(jsonPath("$.visualizerSpeed", is(800)));
    }

    @Test
    @DisplayName("POST /api/user/progress/topic tracks completed topic")
    void trackTopicProgress() throws Exception {
        String topicPayload = """
                {
                    "topicSlug": "variables-and-data-types",
                    "completed": true
                }
                """;

        mockMvc.perform(post("/api/user/progress/topic")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(topicPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progress.completedTopicsCount", is(1)))
                .andExpect(jsonPath("$.progress.completedTopics", hasItem("variables-and-data-types")));
    }

    @Test
    @DisplayName("POST /api/user/progress/question tracks solved practice question")
    void trackQuestionProgress() throws Exception {
        String questionPayload = """
                {
                    "questionId": "q-vars-101",
                    "solved": true
                }
                """;

        mockMvc.perform(post("/api/user/progress/question")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(questionPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progress.solvedQuestionsCount", is(1)))
                .andExpect(jsonPath("$.progress.solvedQuestions", hasItem("q-vars-101")));
    }

    @Test
    @DisplayName("POST /api/user/progress/algorithm tracks algorithm bookmark")
    void trackAlgorithmBookmark() throws Exception {
        String algoPayload = """
                {
                    "algorithmId": "bubble-sort",
                    "bookmarked": true
                }
                """;

        mockMvc.perform(post("/api/user/progress/algorithm")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(algoPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progress.bookmarkedAlgorithmsCount", is(1)))
                .andExpect(jsonPath("$.progress.bookmarkedAlgorithms", hasItem("bubble-sort")));
    }

    @Test
    @DisplayName("CRUD /api/user/snippets creates, lists, and deletes code snippets")
    void snippetLifecycle() throws Exception {
        String snippetPayload = """
                {
                    "title": "Binary Search Template",
                    "code": "int l = 0, r = arr.length - 1;",
                    "description": "Standard binary search invariant"
                }
                """;

        String createRes = mockMvc.perform(post("/api/user/snippets")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(snippetPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Binary Search Template")))
                .andReturn().getResponse().getContentAsString();

        String snippetId = createRes.split("\"id\":")[1].split(",")[0].trim();

        // List
        mockMvc.perform(get("/api/user/snippets")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Binary Search Template")));

        // Delete
        mockMvc.perform(delete("/api/user/snippets/" + snippetId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isNoContent());

        // Verify empty
        mockMvc.perform(get("/api/user/snippets")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("PUT /api/user/password changes password and verifies login with new password")
    void changePasswordSuccess() throws Exception {
        String changePayload = """
                {
                    "currentPassword": "InitialPassword123!",
                    "newPassword": "BrandNewSecretPassword456!"
                }
                """;

        mockMvc.perform(put("/api/user/password")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(changePayload))
                .andExpect(status().isOk());

        // Login with old password fails
        String oldLogin = """
                {
                    "usernameOrEmail": "profile_tester",
                    "password": "InitialPassword123!"
                }
                """;
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oldLogin))
                .andExpect(status().isUnauthorized());

        // Login with new password succeeds
        String newLogin = """
                {
                    "usernameOrEmail": "profile_tester",
                    "password": "BrandNewSecretPassword456!"
                }
                """;
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newLogin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }
}
