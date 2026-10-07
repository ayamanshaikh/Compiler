package com.codevista.dto;

import jakarta.validation.constraints.NotBlank;

public class BookmarkAlgorithmRequest {

    @NotBlank(message = "Algorithm ID is required")
    private String algorithmId;

    private boolean bookmarked = true;

    public BookmarkAlgorithmRequest() {
    }

    public BookmarkAlgorithmRequest(String algorithmId, boolean bookmarked) {
        this.algorithmId = algorithmId;
        this.bookmarked = bookmarked;
    }

    public String getAlgorithmId() {
        return algorithmId;
    }

    public void setAlgorithmId(String algorithmId) {
        this.algorithmId = algorithmId;
    }

    public boolean isBookmarked() {
        return bookmarked;
    }

    public void setBookmarked(boolean bookmarked) {
        this.bookmarked = bookmarked;
    }
}
