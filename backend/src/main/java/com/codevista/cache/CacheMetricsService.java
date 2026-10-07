package com.codevista.cache;

import com.codevista.config.MonitoredConcurrentMapCache;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

@Service
public class CacheMetricsService {

    private final CacheManager cacheManager;

    public CacheMetricsService(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public CacheMetricsSummary getMetricsSummary() {
        long totalHits = 0;
        long totalMisses = 0;
        long totalEntries = 0;
        Map<String, Integer> cacheEntryCounts = new HashMap<>();

        Collection<String> cacheNames = cacheManager.getCacheNames();
        for (String name : cacheNames) {
            Cache cache = cacheManager.getCache(name);
            if (cache instanceof MonitoredConcurrentMapCache monitored) {
                totalHits += monitored.getHits();
                totalMisses += monitored.getMisses();
                int size = monitored.getSize();
                totalEntries += size;
                cacheEntryCounts.put(name, size);
            } else if (cache != null) {
                cacheEntryCounts.put(name, 0);
            }
        }

        double hitRatio = (totalHits + totalMisses > 0)
                ? (double) totalHits / (totalHits + totalMisses)
                : 0.0;

        return new CacheMetricsSummary(totalEntries, totalHits, totalMisses, hitRatio, cacheEntryCounts);
    }

    public void clearAllCaches() {
        Collection<String> cacheNames = cacheManager.getCacheNames();
        for (String name : cacheNames) {
            Cache cache = cacheManager.getCache(name);
            if (cache != null) {
                cache.clear();
            }
        }
    }
}
