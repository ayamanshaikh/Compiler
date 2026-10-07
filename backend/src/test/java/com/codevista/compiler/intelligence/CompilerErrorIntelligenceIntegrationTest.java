package com.codevista.compiler.intelligence;

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
class CompilerErrorIntelligenceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("End-to-End: Missing semicolon produces rich beginner explanation")
    void testEndToEndMissingSemicolon() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { public static void main(String[] args) { int count = 10 } }"
                }
                """;

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.diagnostics[0].explanation.technicalError", containsString("';' expected")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.simpleExplanation", containsString("semicolon (;)")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.whyItHappened", containsString("must end with a semicolon")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.howToFix", containsString("Add a semicolon (;)")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.affectedLine", is(1)))
                .andExpect(jsonPath("$.diagnostics[0].explanation.suggestion", containsString(";")));
    }

    @Test
    @DisplayName("End-to-End: Cannot find variable symbol produces variable explanation")
    void testEndToEndCannotFindVariable() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { public static void main(String[] args) { System.out.println(unknownVar); } }"
                }
                """;

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.diagnostics[0].explanation.technicalError", containsString("cannot find symbol")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.simpleExplanation", containsString("unknownVar")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.howToFix", containsString("Declare the variable")));
    }

    @Test
    @DisplayName("End-to-End: Incompatible types produces type conversion explanation")
    void testEndToEndIncompatibleTypes() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { public static void main(String[] args) { int num = \\"string\\"; } }"
                }
                """;

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.diagnostics[0].explanation.technicalError", containsString("incompatible types")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.simpleExplanation", containsString("Cannot assign a value of type")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.whyItHappened", containsString("strongly typed")));
    }

    @Test
    @DisplayName("End-to-End: Missing return statement produces return explanation")
    void testEndToEndMissingReturn() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { public int compute() { } }"
                }
                """;

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.diagnostics[0].explanation.technicalError", containsString("missing return statement")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.simpleExplanation", containsString("missing a 'return' statement")));
    }

    @Test
    @DisplayName("End-to-End: Non-static referenced from static context produces static context explanation")
    void testEndToEndStaticContext() throws Exception {
        String payload = """
                {
                    "language": "java",
                    "sourceCode": "public class Main { int x = 10; public static void main(String[] args) { System.out.println(x); } }"
                }
                """;

        mockMvc.perform(post("/api/compile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.diagnostics[0].explanation.technicalError", containsString("cannot be referenced from a static context")))
                .andExpect(jsonPath("$.diagnostics[0].explanation.simpleExplanation", containsString("non-static variable 'x'")));
    }
}
