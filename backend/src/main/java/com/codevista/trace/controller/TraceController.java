package com.codevista.trace.controller;

import com.codevista.dto.TraceRequest;
import com.codevista.dto.TraceResponse;
import com.codevista.trace.model.ExecutionTrace;
import com.codevista.trace.service.TraceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trace")
public class TraceController {

    private final TraceService traceService;

    public TraceController(TraceService traceService) {
        this.traceService = traceService;
    }

    @PostMapping
    public ResponseEntity<TraceResponse> trace(@Valid @RequestBody TraceRequest request) {
        ExecutionTrace trace = traceService.trace(request);
        return ResponseEntity.ok(new TraceResponse(trace));
    }
}
