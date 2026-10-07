package com.codevista.controller;

import com.codevista.dto.HealthResponse;
import com.codevista.dto.PingRequest;
import com.codevista.dto.PingResponse;
import com.codevista.service.HealthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping("/health")
    public ResponseEntity<HealthResponse> getHealth() {
        HealthResponse response = healthService.getHealthStatus();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/health/ping")
    public ResponseEntity<PingResponse> ping(@Valid @RequestBody PingRequest request) {
        PingResponse response = healthService.processPing(request);
        return ResponseEntity.ok(response);
    }
}
