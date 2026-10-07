package com.codevista.compiler.intelligence.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorExplanation {

    private final String technicalError;
    private final String simpleExplanation;
    private final String whyItHappened;
    private final String howToFix;
    private final long affectedLine;
    private final String relevantSource;
    private final String suggestion;

    public ErrorExplanation(
            String technicalError,
            String simpleExplanation,
            String whyItHappened,
            String howToFix,
            long affectedLine,
            String relevantSource,
            String suggestion
    ) {
        this.technicalError = technicalError;
        this.simpleExplanation = simpleExplanation;
        this.whyItHappened = whyItHappened;
        this.howToFix = howToFix;
        this.affectedLine = affectedLine;
        this.relevantSource = relevantSource;
        this.suggestion = suggestion;
    }

    public String getTechnicalError() {
        return technicalError;
    }

    public String getSimpleExplanation() {
        return simpleExplanation;
    }

    public String getWhyItHappened() {
        return whyItHappened;
    }

    public String getHowToFix() {
        return howToFix;
    }

    public long getAffectedLine() {
        return affectedLine;
    }

    public String getRelevantSource() {
        return relevantSource;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String technicalError;
        private String simpleExplanation;
        private String whyItHappened;
        private String howToFix;
        private long affectedLine;
        private String relevantSource;
        private String suggestion;

        public Builder technicalError(String technicalError) {
            this.technicalError = technicalError;
            return this;
        }

        public Builder simpleExplanation(String simpleExplanation) {
            this.simpleExplanation = simpleExplanation;
            return this;
        }

        public Builder whyItHappened(String whyItHappened) {
            this.whyItHappened = whyItHappened;
            return this;
        }

        public Builder howToFix(String howToFix) {
            this.howToFix = howToFix;
            return this;
        }

        public Builder affectedLine(long affectedLine) {
            this.affectedLine = affectedLine;
            return this;
        }

        public Builder relevantSource(String relevantSource) {
            this.relevantSource = relevantSource;
            return this;
        }

        public Builder suggestion(String suggestion) {
            this.suggestion = suggestion;
            return this;
        }

        public ErrorExplanation build() {
            return new ErrorExplanation(
                    technicalError,
                    simpleExplanation,
                    whyItHappened,
                    howToFix,
                    affectedLine,
                    relevantSource,
                    suggestion
            );
        }
    }
}
