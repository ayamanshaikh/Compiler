package com.codevista.compiler.pipeline.controller;

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
class CompilerPipelineControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/compiler/pipeline returns 200 with all 5 compiler stages for valid code")
    void inspectPipelineValidProgramShouldReturnSuccess() throws Exception {
        String payload = """
                {
                    "language": "JAVA",
                    "sourceCode": "public class Main { public static void main(String[] args) { int a = 5; System.out.println(a); } }",
                    "className": "Main"
                }
                """;

        mockMvc.perform(post("/api/compiler/pipeline")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.stages", hasSize(5)))
                .andExpect(jsonPath("$.stages[0].stage", is("SOURCE_CODE")))
                .andExpect(jsonPath("$.stages[1].stage", is("LEXICAL_ANALYSIS")))
                .andExpect(jsonPath("$.stages[2].stage", is("SYNTAX_ANALYSIS")))
                .andExpect(jsonPath("$.stages[3].stage", is("SYMBOL_RESOLUTION")))
                .andExpect(jsonPath("$.stages[4].stage", is("BYTECODE_DISASSEMBLY")))
                .andExpect(jsonPath("$.tokens", not(empty())))
                .andExpect(jsonPath("$.astRoot", notNullValue()))
                .andExpect(jsonPath("$.symbols", not(empty())))
                .andExpect(jsonPath("$.bytecode", not(empty())))
                .andExpect(jsonPath("$.compilationTimeMs", greaterThan(0)));
    }

    @Test
    @DisplayName("POST /api/compiler/pipeline returns 400 for empty source code")
    void inspectPipelineEmptyCodeReturnsBadRequest() throws Exception {
        String payload = """
                {
                    "language": "JAVA",
                    "sourceCode": ""
                }
                """;

        mockMvc.perform(post("/api/compiler/pipeline")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }
}
