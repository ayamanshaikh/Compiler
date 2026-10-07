package com.codevista.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CompilerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/compile compiles valid Java program and returns 200 with success status")
    void compileValidProgramShouldReturnSuccess() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { public static void main(String[] args) { System.out.println(\\"Hello!\\"); } }"
                }
                """;

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.compilerStatus", is("SUCCESS")))
                .andExpect(jsonPath("$.diagnostics", hasSize(0)))
                .andExpect(jsonPath("$.mainClass", is("Main")))
                .andExpect(jsonPath("$.compilationTimeMs", greaterThan(0)));
    }

    @Test
    @DisplayName("POST /api/compile preserves exact compiler diagnostic on failure")
    void compileFailingProgramPreservesDiagnostics() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { public static void main(String[] args) { int a = 5 } }"
                }
                """;

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.compilerStatus", is("ERROR")))
                .andExpect(jsonPath("$.diagnostics", notNullValue()))
                .andExpect(jsonPath("$.diagnostics[0].line", notNullValue()))
                .andExpect(jsonPath("$.diagnostics[0].column", notNullValue()))
                .andExpect(jsonPath("$.diagnostics[0].message", containsString("';' expected")))
                .andExpect(jsonPath("$.diagnostics[0].diagnosticType", is("ERROR")));
    }

    @Test
    @DisplayName("POST /api/compile with empty sourceCode returns 400 Bad Request")
    void compileEmptySourceReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": ""
                }
                """;

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors[0].field", is("sourceCode")))
                .andExpect(jsonPath("$.validationErrors[0].message", is("Source code must not be blank")));
    }

    @Test
    @DisplayName("POST /api/compile with extremely large sourceCode (>64KB) returns 400 Bad Request")
    void compileExtremelyLargeSourceReturnsBadRequest() throws Exception {
        String hugeSource = "/* " + "A".repeat(70000) + " */ public class Main {}";
        String payload = String.format("""
                {
                    "language": "java",
                    "sourceCode": "%s"
                }
                """, hugeSource);

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors[0].field", is("sourceCode")))
                .andExpect(jsonPath("$.validationErrors[0].message", containsString("Source code must not exceed 64 KB")));
    }

    @Test
    @DisplayName("POST /api/compile with malformed JSON body returns 400 Bad Request")
    void compileMalformedRequestReturnsBadRequest() throws Exception {
        String malformedPayload = "{ \"language\": \"java\", \"sourceCode\": ";

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")));
    }

    @Test
    @DisplayName("POST /api/compile with unsupported language returns 400 Bad Request")
    void compileUnsupportedLanguageReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "language": "python",
                    "sourceCode": "print('hello')"
                }
                """;

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Unsupported language: 'python'")));
    }
}
