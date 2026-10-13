package com.codevista.compiler.pipeline.controller;

import com.codevista.compiler.pipeline.model.CompilerPipelineResult;
import com.codevista.compiler.pipeline.service.CompilerPipelineService;
import com.codevista.dto.CompilerPipelineRequest;
import com.codevista.dto.CompilerPipelineResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes multi-stage compiler pipeline inspection API.
 */
@RestController
@RequestMapping("/api/compiler")
public class CompilerPipelineController {

    private final CompilerPipelineService pipelineService;

    public CompilerPipelineController(CompilerPipelineService pipelineService) {
        this.pipelineService = pipelineService;
    }

    @PostMapping("/pipeline")
    public ResponseEntity<CompilerPipelineResponse> inspectPipeline(@Valid @RequestBody CompilerPipelineRequest request) {
        CompilerPipelineResult result = pipelineService.analyze(request);
        return ResponseEntity.ok(new CompilerPipelineResponse(result));
    }
}
