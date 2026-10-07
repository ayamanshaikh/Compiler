package com.codevista.algorithm.controller;

import com.codevista.algorithm.dto.AlgorithmInfoResponse;
import com.codevista.algorithm.dto.AlgorithmTraceRequest;
import com.codevista.algorithm.dto.AlgorithmTraceResponse;
import com.codevista.algorithm.service.AlgorithmService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/algorithms")
public class AlgorithmController {

    private final AlgorithmService algorithmService;

    public AlgorithmController(AlgorithmService algorithmService) {
        this.algorithmService = algorithmService;
    }

    @GetMapping
    public ResponseEntity<List<AlgorithmInfoResponse>> getAllAlgorithms() {
        return ResponseEntity.ok(algorithmService.getAllAlgorithms());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<AlgorithmInfoResponse> getAlgorithm(@PathVariable String slug) {
        return ResponseEntity.ok(algorithmService.getAlgorithm(slug));
    }

    @PostMapping("/{slug}/trace")
    public ResponseEntity<AlgorithmTraceResponse> generateTrace(
            @PathVariable String slug,
            @RequestBody(required = false) AlgorithmTraceRequest request) {
        return ResponseEntity.ok(algorithmService.generateTrace(slug, request));
    }
}
