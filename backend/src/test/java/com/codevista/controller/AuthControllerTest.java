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

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/auth/register registers a new student and returns JWT token")
    void registerNewUserSuccess() throws Exception {
        String payload = """
                {
                    "username": "coder_maya",
                    "email": "maya@codevista.ai",
                    "password": "Password123!"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.username", is("coder_maya")))
                .andExpect(jsonPath("$.user.email", is("maya@codevista.ai")))
                .andExpect(jsonPath("$.user.role", is("ROLE_STUDENT")));
    }

    @Test
    @DisplayName("POST /api/auth/register rejects duplicate username with 400 Bad Request")
    void registerDuplicateUsernameRejected() throws Exception {
        String payload = """
                {
                    "username": "duplicate_user",
                    "email": "first@codevista.ai",
                    "password": "Password123!"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());

        String duplicatePayload = """
                {
                    "username": "duplicate_user",
                    "email": "second@codevista.ai",
                    "password": "Password123!"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicatePayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Username 'duplicate_user' is already registered")));
    }

    @Test
    @DisplayName("POST /api/auth/login authenticates registered user and returns token")
    void loginSuccess() throws Exception {
        String regPayload = """
                {
                    "username": "johndoe",
                    "email": "john@codevista.ai",
                    "password": "MySecretPassword123"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isCreated());

        String loginPayload = """
                {
                    "usernameOrEmail": "johndoe",
                    "password": "MySecretPassword123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.username", is("johndoe")));
    }

    @Test
    @DisplayName("POST /api/auth/login fails on incorrect password with 401 Unauthorized")
    void loginWrongPasswordFails() throws Exception {
        String regPayload = """
                {
                    "username": "security_test",
                    "email": "security@codevista.ai",
                    "password": "CorrectPassword"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isCreated());

        String loginPayload = """
                {
                    "usernameOrEmail": "security_test",
                    "password": "WrongPassword!"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/auth/me returns current user summary when authenticated")
    void getCurrentUserAuthenticated() throws Exception {
        String regPayload = """
                {
                    "username": "auth_me_user",
                    "email": "me@codevista.ai",
                    "password": "Password123!"
                }
                """;

        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // extract token
        String token = registerResponse.split("\"token\":\"")[1].split("\"")[0];

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("auth_me_user")))
                .andExpect(jsonPath("$.email", is("me@codevista.ai")));
    }

    @Test
    @DisplayName("GET /api/auth/me returns 401 Unauthorized when missing token")
    void getCurrentUserWithoutTokenFails() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
