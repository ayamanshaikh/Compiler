package com.codevista.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Missing request body returns HTTP 400 with structured ErrorResponse")
    void missingRequestBodyReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/health/ping")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", containsString("Malformed JSON or unreadable request body")))
                .andExpect(jsonPath("$.path", is("/api/health/ping")))
                .andExpect(jsonPath("$.timestamp", notNullValue()))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    @Test
    @DisplayName("Malformed JSON payload returns HTTP 400 with structured ErrorResponse")
    void malformedJsonReturnsBadRequest() throws Exception {
        String malformedJson = "{ \"message\": ";

        mockMvc.perform(post("/api/health/ping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.message", is("Malformed JSON or unreadable request body")))
                .andExpect(jsonPath("$.path", is("/api/health/ping")))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    @Test
    @DisplayName("Missing required field returns HTTP 400 with validation error details")
    void missingRequiredFieldReturnsValidationErrors() throws Exception {
        String emptyObject = "{}";

        mockMvc.perform(post("/api/health/ping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(emptyObject))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")))
                .andExpect(jsonPath("$.path", is("/api/health/ping")))
                .andExpect(jsonPath("$.validationErrors", hasSize(1)))
                .andExpect(jsonPath("$.validationErrors[0].field", is("message")))
                .andExpect(jsonPath("$.validationErrors[0].message", is("Message must not be blank")))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    @Test
    @DisplayName("Blank field value returns HTTP 400 with validation error details")
    void blankFieldReturnsValidationErrors() throws Exception {
        String blankMessage = """
                {
                    "message": "   "
                }
                """;

        mockMvc.perform(post("/api/health/ping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(blankMessage))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors[0].field", is("message")))
                .andExpect(jsonPath("$.validationErrors[0].message", is("Message must not be blank")))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    @Test
    @DisplayName("Exceeding max size returns HTTP 400 with validation error details")
    void exceedingMaxSizeReturnsValidationErrors() throws Exception {
        String oversized = "a".repeat(300);
        String body = String.format("{\"message\": \"%s\"}", oversized);

        mockMvc.perform(post("/api/health/ping")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors[0].field", is("message")))
                .andExpect(jsonPath("$.validationErrors[0].message", is("Message must not exceed 255 characters")))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    @Test
    @DisplayName("Unsupported HTTP method returns HTTP 405 Method Not Allowed")
    void methodNotAllowedReturnsStructuredError() throws Exception {
        mockMvc.perform(put("/api/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status", is(405)))
                .andExpect(jsonPath("$.error", is("Method Not Allowed")))
                .andExpect(jsonPath("$.message", containsString("HTTP method 'PUT' is not supported")))
                .andExpect(jsonPath("$.path", is("/api/health")))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    @Test
    @DisplayName("Accessing non-existent endpoint returns HTTP 404 with structured error")
    void nonExistentEndpointReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/non-existent-path")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", is("Requested resource was not found")))
                .andExpect(jsonPath("$.path", is("/api/non-existent-path")))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }
}
