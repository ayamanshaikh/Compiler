package com.codevista.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CorsConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("CORS preflight request from allowed origin returns appropriate CORS headers")
    void corsAllowedOriginShouldSucceed() throws Exception {
        mockMvc.perform(options("/api/health")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CORS preflight request from disallowed origin does not return allow header")
    void corsDisallowedOriginShouldNotBeAllowed() throws Exception {
        mockMvc.perform(options("/api/health")
                        .header("Origin", "http://malicious-site.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
