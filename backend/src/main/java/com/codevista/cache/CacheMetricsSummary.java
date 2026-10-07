package com.codevista.cache;

import java.util.Map;

public record CacheMetricsSummary(
        long totalEntries,
        long hits,
        long misses,
        double hitRatio,
        Map<String, Integer> cacheEntryCounts
) {
}
