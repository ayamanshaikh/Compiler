package com.codevista.controller;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PracticeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/practice/questions returns questions with masked answers and explanations")
    void getQuestionsMasksAnswersBeforeSubmission() throws Exception {
        mockMvc.perform(get("/api/practice/questions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(10)))
                // Crucial security/pedagogical test: answers must not be leaked
                .andExpect(jsonPath("$[0].correctAnswer").doesNotExist())
                .andExpect(jsonPath("$[0].explanation").doesNotExist())
                .andExpect(jsonPath("$[0].title", notNullValue()))
                .andExpect(jsonPath("$[0].prompt", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/practice/questions with topic filter returns matching questions")
    void getQuestionsWithTopicFilter() throws Exception {
        mockMvc.perform(get("/api/practice/questions")
                        .param("topic", "arrays")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$[0].topicSlug", is("arrays")));
    }

    @Test
    @DisplayName("POST /api/practice/submit with correct MCQ answer reveals answer, explanation and updates stats")
    void submitCorrectMcqAnswerRevealsExplanation() throws Exception {
        String payload = """
                {
                    "questionId": 1,
                    "userAnswer": "A"
                }
                """;

        mockMvc.perform(post("/api/practice/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionId", is(1)))
                .andExpect(jsonPath("$.correct", is(true)))
                .andExpect(jsonPath("$.correctAnswer", is("A")))
                .andExpect(jsonPath("$.explanation", containsString("Oak")))
                .andExpect(jsonPath("$.feedback", containsString("Correct")));
    }

    @Test
    @DisplayName("POST /api/practice/submit with incorrect answer returns correct=false and reveals explanation")
    void submitIncorrectAnswerReturnsExplanation() throws Exception {
        String payload = """
                {
                    "questionId": 1,
                    "userAnswer": "C"
                }
                """;

        mockMvc.perform(post("/api/practice/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionId", is(1)))
                .andExpect(jsonPath("$.correct", is(false)))
                .andExpect(jsonPath("$.correctAnswer", is("A")))
                .andExpect(jsonPath("$.explanation", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/practice/submit with executable code compiles and evaluates actual output")
    void submitExecutableCodeEvaluatesOutput() throws Exception {
        // Question 7 is WRITE_CODE (Compute Array Sum) expecting output 50
        String code = """
                public class Main {
                    public static void main(String[] args) {
                        int[] arr = {5, 10, 15, 20};
                        int sum = 0;
                        for (int n : arr) sum += n;
                        System.out.println(sum);
                    }
                }
                """;

        String payload = """
                {
                    "questionId": 7,
                    "sourceCode": "%s"
                }
                """.formatted(code.replace("\n", "\\n").replace("\"", "\\\""));

        mockMvc.perform(post("/api/practice/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionId", is(7)))
                .andExpect(jsonPath("$.correct", is(true)))
                .andExpect(jsonPath("$.compilerOutput", containsString("50")));
    }

    @Test
    @DisplayName("GET /api/practice/stats returns tracking metrics and performance breakdowns")
    void getStatsReturnsMetrics() throws Exception {
        String payload = """
                {
                    "questionId": 1,
                    "userAnswer": "A"
                }
                """;
        mockMvc.perform(post("/api/practice/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/practice/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAttempts", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.accuracyPercentage", notNullValue()))
                .andExpect(jsonPath("$.topicPerformance", notNullValue()))
                .andExpect(jsonPath("$.difficultyPerformance", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/practice/stats/reset clears stats")
    void resetStatsClearsCounters() throws Exception {
        mockMvc.perform(post("/api/practice/stats/reset")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("reset successfully")));

        mockMvc.perform(get("/api/practice/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAttempts", is(0)))
                .andExpect(jsonPath("$.correctCount", is(0)));
    }
}
