package com.codevista.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String TOPICS_CACHE = "topics";
    public static final String TOPIC_SUMMARIES_CACHE = "topic-summaries";
    public static final String PRACTICE_QUESTIONS_CACHE = "practice-questions";
    public static final String COMPILATION_CACHE = "compilation-results";
    public static final String TRACE_CACHE = "trace-results";

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager() {
            @Override
            protected org.springframework.cache.concurrent.ConcurrentMapCache createConcurrentMapCache(String name) {
                return new MonitoredConcurrentMapCache(name);
            }
        };
        cacheManager.setCacheNames(List.of(
                TOPICS_CACHE,
                TOPIC_SUMMARIES_CACHE,
                PRACTICE_QUESTIONS_CACHE,
                COMPILATION_CACHE,
                TRACE_CACHE
        ));
        return cacheManager;
    }
}
