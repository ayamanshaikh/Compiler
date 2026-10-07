package com.codevista.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TraceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/trace executes program and returns authentic execution trace steps")
    void traceValidProgramReturnsTraceSteps() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main {\\n    public static void main(String[] args) {\\n        int x = 10;\\n        int y = 20;\\n        System.out.println(x + y);\\n    }\\n}"
                }
                """;

        mockMvc.perform(post("/api/trace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.totalSteps", greaterThan(0)))
                .andExpect(jsonPath("$.steps", notNullValue()))
                .andExpect(jsonPath("$.finalOutput", containsString("30")));
    }

    @Test
    @DisplayName("POST /api/trace with blank source returns 400 Bad Request")
    void traceBlankSourceReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": ""
                }
                """;

        mockMvc.perform(post("/api/trace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors[0].field", is("sourceCode")));
    }

    @Test
    @DisplayName("POST /api/trace with unsupported language returns 400 Bad Request")
    void traceUnsupportedLanguageReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "language": "c",
                    "sourceCode": "int main() { return 0; }"
                }
                """;

        mockMvc.perform(post("/api/trace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Unsupported language")));
    }
}
