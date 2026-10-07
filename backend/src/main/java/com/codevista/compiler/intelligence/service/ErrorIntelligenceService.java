package com.codevista.compiler.intelligence.service;

import com.codevista.compiler.intelligence.explainer.DiagnosticExplainer;
import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ErrorIntelligenceService {

    private final List<DiagnosticExplainer> explainers;

    public ErrorIntelligenceService(List<DiagnosticExplainer> explainers) {
        this.explainers = explainers.stream()
                .sorted(Comparator.comparingInt(DiagnosticExplainer::getOrder))
                .collect(Collectors.toList());
    }

    public ErrorExplanation explain(CompilerDiagnostic diagnostic) {
        if (diagnostic == null) {
            return null;
        }

        for (DiagnosticExplainer explainer : explainers) {
            if (explainer.supports(diagnostic)) {
                return explainer.explain(diagnostic);
            }
        }

        return ErrorExplanation.builder()
                .technicalError(diagnostic.getMessage())
                .simpleExplanation("Compiler diagnostic reported on line " + diagnostic.getLine() + ".")
                .whyItHappened("The syntax or symbol could not be processed by the Java compiler.")
                .howToFix("Review line " + diagnostic.getLine() + " for syntax discrepancies.")
                .affectedLine(diagnostic.getLine())
                .relevantSource(diagnostic.getSourceContext())
                .build();
    }

    public CompilerDiagnostic enrichDiagnostic(CompilerDiagnostic diagnostic) {
        if (diagnostic == null) {
            return null;
        }
        if (diagnostic.getExplanation() != null) {
            return diagnostic;
        }
        ErrorExplanation explanation = explain(diagnostic);
        return diagnostic.withExplanation(explanation);
    }

    public List<CompilerDiagnostic> enrichDiagnostics(List<CompilerDiagnostic> diagnostics) {
        if (diagnostics == null || diagnostics.isEmpty()) {
            return List.of();
        }
        return diagnostics.stream()
                .filter(Objects::nonNull)
                .map(this::enrichDiagnostic)
                .collect(Collectors.toList());
    }
}
