package com.codevista.execution.controller;

import com.codevista.dto.ExecuteRequest;
import com.codevista.dto.ExecuteResponse;
import com.codevista.execution.model.ExecutionResult;
import com.codevista.execution.service.ExecutionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/execute")
public class ExecutionController {

    private final ExecutionService executionService;

    public ExecutionController(ExecutionService executionService) {
        this.executionService = executionService;
    }

    @PostMapping
    public ResponseEntity<ExecuteResponse> execute(@Valid @RequestBody ExecuteRequest request) {
        ExecutionResult result = executionService.execute(request);
        return ResponseEntity.ok(new ExecuteResponse(result));
    }
}
