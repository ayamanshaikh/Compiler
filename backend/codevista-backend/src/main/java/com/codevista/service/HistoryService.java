package com.codevista.service;

import com.codevista.model.HistoryEntry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-memory record of recent compile/run attempts.
 *
 * <p>Kept deliberately small: a bounded ring of the most recent entries,
 * no database. If persistence is ever required, replace this service with
 * one backed by a repository — the {@code HistoryEntry} record and the
 * controller endpoint stay unchanged.
 */
@Service
public class HistoryService {

    private final int maxEntries;
    private final Deque<HistoryEntry> entries = new ArrayDeque<>();
    private final AtomicLong idCounter = new AtomicLong(1);

    public HistoryService(
            @Value("${codevista.history.max-entries:50}") int maxEntries
    ) {
        this.maxEntries = Math.max(1, maxEntries);
    }

    public synchronized HistoryEntry record(
            String language,
            String code,
            boolean success,
            String message,
            String output,
            String error
    ) {
        HistoryEntry entry = new HistoryEntry(
                idCounter.getAndIncrement(),
                Instant.now(),
                language,
                truncate(code, 4000),
                success,
                truncate(message, 500),
                truncate(output, 2000),
                truncate(error, 2000)
        );

        entries.addFirst(entry);
        while (entries.size() > maxEntries) {
            entries.removeLast();
        }
        return entry;
    }

    public synchronized List<HistoryEntry> recent() {
        return List.copyOf(entries);
    }

    private static String truncate(String value, int max) {
        if (value == null) return null;
        if (value.length() <= max) return value;
        return value.substring(0, max) + "…";
    }
}