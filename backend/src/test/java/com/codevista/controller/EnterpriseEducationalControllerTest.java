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
class EnterpriseEducationalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/enterprise/servlets/scenarios returns available servlet scenarios")
    void getServletScenarios() throws Exception {
        mockMvc.perform(get("/api/enterprise/servlets/scenarios")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(5)))
                .andExpect(jsonPath("$[0].id", is("hello-get")))
                .andExpect(jsonPath("$[0].servletCode", containsString("HelloServlet")));
    }

    @Test
    @DisplayName("POST /api/enterprise/servlets/execute runs HelloServlet and generates lifecycle steps")
    void executeHelloServlet() throws Exception {
        String payload = """
                {
                    "scenarioId": "hello-get",
                    "method": "GET",
                    "path": "/hello",
                    "queryParams": {
                        "name": "CodeVistaUser"
                    }
                }
                """;

        mockMvc.perform(post("/api/enterprise/servlets/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.response.statusCode", is(200)))
                .andExpect(jsonPath("$.response.body", containsString("CodeVistaUser")))
                .andExpect(jsonPath("$.lifecycleSteps", hasSize(greaterThanOrEqualTo(5))))
                .andExpect(jsonPath("$.lifecycleSteps[?(@.phase == 'REQUEST_PARSING')]").exists())
                .andExpect(jsonPath("$.lifecycleSteps[?(@.phase == 'SERVICE_DISPATCH')]").exists());
    }

    @Test
    @DisplayName("POST /api/enterprise/servlets/execute handles AuthFilter blocking and passing")
    void executeAuthFilter() throws Exception {
        // Blocked request
        String blockedPayload = """
                {
                    "scenarioId": "auth-filter",
                    "method": "GET",
                    "path": "/protected/data",
                    "headers": {}
                }
                """;

        mockMvc.perform(post("/api/enterprise/servlets/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(blockedPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response.statusCode", is(401)))
                .andExpect(jsonPath("$.lifecycleSteps[?(@.phase == 'FILTER_PRE_HANDLE')]").exists());

        // Allowed request
        String allowedPayload = """
                {
                    "scenarioId": "auth-filter",
                    "method": "GET",
                    "path": "/protected/data",
                    "headers": {
                        "Authorization": "Bearer valid-token-test"
                    }
                }
                """;

        mockMvc.perform(post("/api/enterprise/servlets/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(allowedPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response.statusCode", is(200)))
                .andExpect(jsonPath("$.response.body", containsString("Confidential enterprise report unlocked.")));
    }

    @Test
    @DisplayName("POST /api/enterprise/servlets/execute mutates session and sets cookie in SessionCartServlet")
    void executeSessionCartServlet() throws Exception {
        String payload = """
                {
                    "scenarioId": "session-cart",
                    "method": "GET",
                    "path": "/cart",
                    "queryParams": {
                        "item": "Spring_Boot_Pro_Book"
                    }
                }
                """;

        mockMvc.perform(post("/api/enterprise/servlets/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response.statusCode", is(200)))
                .andExpect(jsonPath("$.response.headers['Set-Cookie']", containsString("JSESSIONID=")))
                .andExpect(jsonPath("$.response.body", containsString("Spring_Boot_Pro_Book")));
    }

    @Test
    @DisplayName("GET /api/enterprise/hibernate/scenarios returns available ORM scenarios")
    void getHibernateScenarios() throws Exception {
        mockMvc.perform(get("/api/enterprise/hibernate/scenarios")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", notNullValue()))
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(5)))
                .andExpect(jsonPath("$[0].id", is("entity-lifecycle")))
                .andExpect(jsonPath("$[0].entityJavaCode", containsString("@Entity")));
    }

    @Test
    @DisplayName("POST /api/enterprise/hibernate/execute simulates entity lifecycle transitions")
    void executeHibernateEntityLifecycle() throws Exception {
        String payload = """
                {
                    "scenarioId": "entity-lifecycle"
                }
                """;

        mockMvc.perform(post("/api/enterprise/hibernate/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.steps", hasSize(5)))
                .andExpect(jsonPath("$.steps[0].entityState", is("TRANSIENT")))
                .andExpect(jsonPath("$.steps[1].entityState", is("PERSISTENT")))
                .andExpect(jsonPath("$.steps[2].entityState", is("DETACHED")))
                .andExpect(jsonPath("$.steps[3].entityState", is("PERSISTENT")))
                .andExpect(jsonPath("$.steps[4].entityState", is("REMOVED")))
                .andExpect(jsonPath("$.generatedSqlList", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("POST /api/enterprise/hibernate/execute demonstrates First-Level Cache deduplication")
    void executeFirstLevelCacheDeduplication() throws Exception {
        String payload = """
                {
                    "scenarioId": "first-level-cache"
                }
                """;

        mockMvc.perform(post("/api/enterprise/hibernate/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalQueriesFired", is(1)))
                .andExpect(jsonPath("$.steps[0].title", containsString("CACHE MISS")))
                .andExpect(jsonPath("$.steps[1].title", containsString("CACHE HIT")));
    }

    @Test
    @DisplayName("POST /api/enterprise/hibernate/execute compares N+1 problem against JOIN FETCH solution")
    void compareNPlusOneAgainstJoinFetch() throws Exception {
        // N+1 problem: 5 queries fired
        String nPlusOnePayload = """
                {
                    "scenarioId": "n-plus-one-problem"
                }
                """;

        mockMvc.perform(post("/api/enterprise/hibernate/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nPlusOnePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalQueriesFired", is(5)));

        // JOIN FETCH solution: exactly 1 single query fired!
        String joinFetchPayload = """
                {
                    "scenarioId": "join-fetch-solution"
                }
                """;

        mockMvc.perform(post("/api/enterprise/hibernate/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(joinFetchPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalQueriesFired", is(1)))
                .andExpect(jsonPath("$.generatedSqlList[0]", containsString("LEFT OUTER JOIN")))
                .andExpect(jsonPath("$.explanation", containsString("JOIN FETCH")));
    }
}
