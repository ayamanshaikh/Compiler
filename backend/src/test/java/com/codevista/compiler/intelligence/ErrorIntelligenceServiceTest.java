package com.codevista.compiler.intelligence;

import com.codevista.compiler.intelligence.explainer.DiagnosticExplainer;
import com.codevista.compiler.intelligence.explainer.SemicolonExpectedExplainer;
import com.codevista.compiler.intelligence.explainer.DefaultFallbackExplainer;
import com.codevista.compiler.intelligence.model.ErrorExplanation;
import com.codevista.compiler.intelligence.service.ErrorIntelligenceService;
import com.codevista.compiler.model.CompilerDiagnostic;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ErrorIntelligenceServiceTest {

    @Test
    @DisplayName("ErrorIntelligenceService resolves matching explainer by priority and enriches diagnostics")
    void shouldResolveMatchingExplainerAndEnrich() {
        List<DiagnosticExplainer> explainers = List.of(
                new DefaultFallbackExplainer(),
                new SemicolonExpectedExplainer()
        );
        ErrorIntelligenceService service = new ErrorIntelligenceService(explainers);

        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                3, 10, "';' expected", "int a = 1", "ERROR", "compiler.err.expected"
        );

        CompilerDiagnostic enriched = service.enrichDiagnostic(diagnostic);

        assertThat(enriched).isNotNull();
        assertThat(enriched.getExplanation()).isNotNull();
        ErrorExplanation explanation = enriched.getExplanation();
        assertThat(explanation.getSimpleExplanation()).contains("semicolon (;)");
        assertThat(explanation.getSuggestion()).isEqualTo("int a = 1;");
    }

    @Test
    @DisplayName("ErrorIntelligenceService falls back to default explainer when no specific explainer matches")
    void shouldFallbackWhenNoSpecificExplainerMatches() {
        List<DiagnosticExplainer> explainers = List.of(
                new DefaultFallbackExplainer()
        );
        ErrorIntelligenceService service = new ErrorIntelligenceService(explainers);

        CompilerDiagnostic diagnostic = new CompilerDiagnostic(
                8, 2, "some rare compiler warning", "dummy code", "WARNING", "compiler.warn.rare"
        );

        CompilerDiagnostic enriched = service.enrichDiagnostic(diagnostic);

        assertThat(enriched).isNotNull();
        assertThat(enriched.getExplanation()).isNotNull();
        assertThat(enriched.getExplanation().getSimpleExplanation()).contains("line 8");
    }

    @Test
    @DisplayName("ErrorIntelligenceService enrichDiagnostics safely handles empty and null lists")
    void shouldHandleEmptyAndNullLists() {
        ErrorIntelligenceService service = new ErrorIntelligenceService(List.of(new DefaultFallbackExplainer()));

        assertThat(service.enrichDiagnostics(null)).isEmpty();
        assertThat(service.enrichDiagnostics(List.of())).isEmpty();
    }
}
