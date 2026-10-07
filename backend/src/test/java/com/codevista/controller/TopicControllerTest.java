package com.codevista.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TopicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/topics returns HTTP 200 with list of seeded topics")
    void getTopicsShouldReturnSeededTopics() throws Exception {
        mockMvc.perform(get("/api/topics")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(78)));
    }

    @Test
    @DisplayName("GET /api/topics?difficulty=BEGINNER returns only beginner topics")
    void getTopicsFilterByDifficulty() throws Exception {
        mockMvc.perform(get("/api/topics")
                        .param("difficulty", "BEGINNER")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].difficulty", is("BEGINNER")));
    }

    @Test
    @DisplayName("GET /api/topics?search=Inheritance returns matching topics")
    void getTopicsFilterBySearch() throws Exception {
        mockMvc.perform(get("/api/topics")
                        .param("search", "Inheritance")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title", is("Inheritance")));
    }

    @Test
    @DisplayName("GET /api/topics?sortBy=title returns topics sorted alphabetically")
    void getTopicsSortedAlphabetically() throws Exception {
        mockMvc.perform(get("/api/topics")
                        .param("sortBy", "title")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$[0].title", is("Abstract Classes")));
    }

    @Test
    @DisplayName("GET /api/topics/{slug} returns HTTP 200 with topic details")
    void getTopicBySlugShouldReturnTopicDetails() throws Exception {
        mockMvc.perform(get("/api/topics/history-of-java")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("history-of-java")))
                .andExpect(jsonPath("$.title", is("History of Java")))
                .andExpect(jsonPath("$.difficulty", is("BEGINNER")))
                .andExpect(jsonPath("$.internalUnit", is("Unit 1: Java Basics & OOP Concepts")))
                .andExpect(jsonPath("$.description", notNullValue()))
                .andExpect(jsonPath("$.whyItMatters", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/topics/{slug} with non-existent slug returns HTTP 404")
    void getTopicByInvalidSlugShouldReturnNotFound() throws Exception {
        mockMvc.perform(get("/api/topics/non-existent-slug-xyz")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", is("Topic not found with slug: non-existent-slug-xyz")))
                .andExpect(jsonPath("$.path", is("/api/topics/non-existent-slug-xyz")));
    }

    @Test
    @DisplayName("GET /api/topics/search returns matching topics")
    void searchTopicsShouldReturnResults() throws Exception {
        mockMvc.perform(get("/api/topics/search")
                        .param("q", "Polymorphism")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug", is("polymorphism")))
                .andExpect(jsonPath("$[0].title", is("Polymorphism")));
    }

    @Test
    @DisplayName("GET /api/topics/search with query and difficulty returns filtered results")
    void searchTopicsWithDifficultyFilter() throws Exception {
        mockMvc.perform(get("/api/topics/search")
                        .param("q", "Servlet")
                        .param("difficulty", "ADVANCED")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].difficulty", is("ADVANCED")));
    }

    @Test
    @DisplayName("POST /api/topics creates a new topic and returns HTTP 201 with Location header")
    void createTopicShouldSucceed() throws Exception {
        String payload = """
                {
                    "title": "Java Records Preview",
                    "slug": "java-records-preview",
                    "description": "Immutable data carrier classes in modern Java.",
                    "explanation": "Records provide a compact syntax for declaring classes whose main purpose is to hold data.",
                    "syntax": "public record Point(int x, int y) {}",
                    "difficulty": "INTERMEDIATE",
                    "internalUnit": "Unit 1: Java Basics & OOP Concepts",
                    "sortOrder": 999,
                    "keyPoints": ["Transparent carriers of immutable data", "Automatic equals, hashCode, and toString"],
                    "commonMistakes": ["Trying to extend a record with another class"],
                    "relatedTopicSlugs": ["class", "object"],
                    "codeExamples": [
                        {
                            "title": "Basic Record Declaration",
                            "code": "public record Point(int x, int y) {}",
                            "explanation": "Defines a Point record with components x and y."
                        }
                    ]
                }
                """;

        mockMvc.perform(post("/api/topics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.slug", is("java-records-preview")))
                .andExpect(jsonPath("$.title", is("Java Records Preview")))
                .andExpect(jsonPath("$.keyPoints", hasSize(2)))
                .andExpect(jsonPath("$.codeExamples", hasSize(1)));
    }

    @Test
    @DisplayName("POST /api/topics with duplicate slug returns HTTP 409 Conflict")
    void createTopicWithDuplicateSlugShouldReturnConflict() throws Exception {
        String duplicatePayload = """
                {
                    "title": "Duplicate History",
                    "slug": "history-of-java",
                    "description": "Duplicate description.",
                    "difficulty": "BEGINNER",
                    "sortOrder": 1
                }
                """;

        mockMvc.perform(post("/api/topics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicatePayload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", is("Topic with slug 'history-of-java' already exists")));
    }

    @Test
    @DisplayName("POST /api/topics with invalid data returns HTTP 400 Bad Request")
    void createTopicValidationFailure() throws Exception {
        String invalidPayload = """
                {
                    "title": "",
                    "slug": "",
                    "description": ""
                }
                """;

        mockMvc.perform(post("/api/topics")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors", notNullValue()));
    }
}

