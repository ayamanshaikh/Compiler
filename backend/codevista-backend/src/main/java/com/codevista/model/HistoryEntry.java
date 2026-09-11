package com.codevista.model;

import java.time.Instant;

/**
 * An immutable record of one compile/run attempt, kept in memory for the
 * optional History view. No database is used in this version.
 */
public record HistoryEntry(
        long id,
        Instant timestamp,
        String language,
        String code,
        boolean success,
        String message,
        String output,
        String error
) {
}