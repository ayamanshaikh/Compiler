package com.codevista.config;

import org.springframework.cache.concurrent.ConcurrentMapCache;

import java.util.concurrent.Callable;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Thread-safe concurrent map cache instrumented with hit, miss, put, and eviction telemetry.
 */
public class MonitoredConcurrentMapCache extends ConcurrentMapCache {

    private final AtomicLong hits = new AtomicLong(0);
    private final AtomicLong misses = new AtomicLong(0);
    private final AtomicLong puts = new AtomicLong(0);
    private final AtomicLong evictions = new AtomicLong(0);

    public MonitoredConcurrentMapCache(String name) {
        super(name);
    }

    @Override
    public ValueWrapper get(Object key) {
        ValueWrapper result = super.get(key);
        if (result != null) {
            hits.incrementAndGet();
        } else {
            misses.incrementAndGet();
        }
        return result;
    }

    @Override
    public <T> T get(Object key, Class<T> type) {
        T result = super.get(key, type);
        if (result != null) {
            hits.incrementAndGet();
        } else {
            misses.incrementAndGet();
        }
        return result;
    }

    @Override
    public <T> T get(Object key, Callable<T> valueLoader) {
        if (getNativeCache().containsKey(key)) {
            hits.incrementAndGet();
        } else {
            misses.incrementAndGet();
        }
        return super.get(key, valueLoader);
    }

    @Override
    public void put(Object key, Object value) {
        puts.incrementAndGet();
        super.put(key, value);
    }

    @Override
    public ValueWrapper putIfAbsent(Object key, Object value) {
        puts.incrementAndGet();
        return super.putIfAbsent(key, value);
    }

    @Override
    public void evict(Object key) {
        evictions.incrementAndGet();
        super.evict(key);
    }

    @Override
    public boolean evictIfPresent(Object key) {
        boolean evicted = super.evictIfPresent(key);
        if (evicted) {
            evictions.incrementAndGet();
        }
        return evicted;
    }

    @Override
    public void clear() {
        evictions.incrementAndGet();
        super.clear();
    }

    public long getHits() {
        return hits.get();
    }

    public long getMisses() {
        return misses.get();
    }

    public long getPuts() {
        return puts.get();
    }

    public long getEvictions() {
        return evictions.get();
    }

    public int getSize() {
        return getNativeCache().size();
    }
}
