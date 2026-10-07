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
class AlgorithmControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/algorithms returns all algorithms with metadata")
    void getAllAlgorithms() throws Exception {
        mockMvc.perform(get("/api/algorithms")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(8)))
                .andExpect(jsonPath("$[0].slug", is("bubble-sort")))
                .andExpect(jsonPath("$[0].name", is("Bubble Sort")))
                .andExpect(jsonPath("$[0].category", is("SORTING")))
                .andExpect(jsonPath("$[0].timeComplexityAverage", notNullValue()))
                .andExpect(jsonPath("$[0].javaCode", containsString("public class BubbleSort")));
    }

    @Test
    @DisplayName("GET /api/algorithms/selection-sort returns single algorithm metadata")
    void getSelectionSort() throws Exception {
        mockMvc.perform(get("/api/algorithms/selection-sort")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("selection-sort")))
                .andExpect(jsonPath("$.name", is("Selection Sort")))
                .andExpect(jsonPath("$.spaceComplexity", is("O(1)")))
                .andExpect(jsonPath("$.defaultInput", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/algorithms/bubble-sort/trace generates verified sorting steps")
    void generateBubbleSortTrace() throws Exception {
        String payload = """
                {
                    "input": [5, 1, 4, 2]
                }
                """;

        mockMvc.perform(post("/api/algorithms/bubble-sort/trace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.algorithmSlug", is("bubble-sort")))
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.totalSteps", greaterThan(1)))
                .andExpect(jsonPath("$.steps[0].arrayState", hasSize(4)))
                .andExpect(jsonPath("$.totalComparisons", greaterThan(0)))
                .andExpect(jsonPath("$.totalSwaps", greaterThan(0)));
    }

    @Test
    @DisplayName("POST /api/algorithms/binary-search/trace finds target with mid pointer")
    void generateBinarySearchTrace() throws Exception {
        String payload = """
                {
                    "input": [10, 20, 30, 40, 50],
                    "target": 40
                }
                """;

        mockMvc.perform(post("/api/algorithms/binary-search/trace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.algorithmSlug", is("binary-search")))
                .andExpect(jsonPath("$.steps", notNullValue()))
                .andExpect(jsonPath("$.steps[?(@.description =~ /.*Target 40 found.*/)]").exists());
    }

    @Test
    @DisplayName("POST /api/algorithms/two-sum-sorted/trace finds target sum pair")
    void generateTwoSumTrace() throws Exception {
        String payload = """
                {
                    "input": [2, 7, 11, 15],
                    "target": 9
                }
                """;

        mockMvc.perform(post("/api/algorithms/two-sum-sorted/trace")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.algorithmSlug", is("two-sum-sorted")))
                .andExpect(jsonPath("$.steps[?(@.description =~ /.*Target pair found.*/)]").exists());
    }

    @Test
    @DisplayName("GET /api/algorithms/non-existent returns 404")
    void getNonExistentAlgorithmReturns404() throws Exception {
        mockMvc.perform(get("/api/algorithms/non-existent-algo")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
