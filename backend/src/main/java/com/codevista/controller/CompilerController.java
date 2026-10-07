package com.codevista.controller;

import com.codevista.compiler.model.CompilationResult;
import com.codevista.compiler.service.CompilerService;
import com.codevista.dto.CompileRequest;
import com.codevista.dto.CompileResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CompilerController {

    private final CompilerService compilerService;

    public CompilerController(CompilerService compilerService) {
        this.compilerService = compilerService;
    }

    @PostMapping("/compile")
    public ResponseEntity<CompileResponse> compile(@Valid @RequestBody CompileRequest request) {
        CompilationResult result = compilerService.compile(request);
        return ResponseEntity.ok(new CompileResponse(result));
    }
}
