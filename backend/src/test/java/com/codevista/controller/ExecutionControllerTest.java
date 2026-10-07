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
class ExecutionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/execute runs valid Java program and returns 200 with SUCCESS status")
    void executeValidProgramReturnsSuccess() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { public static void main(String[] args) { System.out.println(\\"Execution OK\\"); } }"
                }
                """;

        mockMvc.perform(post("/api/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.output", containsString("Execution OK")))
                .andExpect(jsonPath("$.exitCode", is(0)))
                .andExpect(jsonPath("$.executionTimeMs", greaterThan(0)));
    }

    @Test
    @DisplayName("POST /api/execute supplies stdin to program and captures output")
    void executeProgramWithInput() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "import java.util.Scanner; public class Main { public static void main(String[] args) { Scanner sc = new Scanner(System.in); System.out.println(\\"Hello \\" + sc.next()); } }",
                    "input": "World"
                }
                """;

        mockMvc.perform(post("/api/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.status", is("SUCCESS")))
                .andExpect(jsonPath("$.output", containsString("Hello World")));
    }

    @Test
    @DisplayName("POST /api/execute captures runtime exception in runtimeError")
    void executeProgramWithRuntimeException() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { public static void main(String[] args) { int[] arr = new int[0]; System.out.println(arr[1]); } }"
                }
                """;

        mockMvc.perform(post("/api/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is("RUNTIME_ERROR")))
                .andExpect(jsonPath("$.runtimeError", containsString("ArrayIndexOutOfBoundsException")));
    }

    @Test
    @DisplayName("POST /api/execute returns COMPILATION_ERROR when source does not compile")
    void executeFailingCompilationReturnsDiagnostics() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { public static void main(String[] args) { int x = 1 } }"
                }
                """;

        mockMvc.perform(post("/api/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is("COMPILATION_ERROR")))
                .andExpect(jsonPath("$.diagnostics", notNullValue()))
                .andExpect(jsonPath("$.diagnostics[0].explanation", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/execute with blank source returns 400 Bad Request")
    void executeBlankSourceReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": ""
                }
                """;

        mockMvc.perform(post("/api/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors[0].field", is("sourceCode")));
    }

    @Test
    @DisplayName("POST /api/execute with unsupported language returns 400 Bad Request")
    void executeUnsupportedLanguageReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "language": "python",
                    "sourceCode": "print('hi')"
                }
                """;

        mockMvc.perform(post("/api/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Unsupported language: 'python'")));
    }
}
