package com.digitaltwin.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * CacheConfig — Caffeine-backed Spring Cache for the Analytics endpoint.
 *
 * Cache: "analyticsCache"
 *   Key:  fieldId (Integer)
 *   TTL:  15 seconds after write
 *   Max:  20 entries (more than enough for 4-5 field IDs)
 *
 * Why 15-second TTL?
 *   - The batch Python prediction takes ~7 seconds per request.
 *   - The frontend polls every 10 seconds.
 *   - Without a cache, polling at t=0 and t=10 would produce overlapping
 *     backend calls (the t=0 call finishes at ~t=7, so t=10 is fine; but
 *     React StrictMode in development doubles effect invocations, causing
 *     two simultaneous calls at t=0).
 *   - With a 15-second TTL:
 *       t=0  : cache miss  → batch script (~7s) → cache entry written
 *       t=10 : cache hit   → < 5 ms response
 *       t=15 : cache expires
 *       t=20 : cache miss  → batch script (~7s) → new fresh data cached
 *     Effective data refresh rate: every ~20 seconds.
 *   - Sensor readings in the database don't change sub-second, so 20-second
 *     refresh granularity is accurate for this Digital Twin system.
 *
 * Only "analyticsCache" is configured here.
 * Dashboard, Simulation, Farms, and other endpoints are NOT cached.
 */
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager("analyticsCache");
        manager.setCaffeine(
                Caffeine.newBuilder()
                        .expireAfterWrite(15, TimeUnit.SECONDS)
                        .maximumSize(20)
        );
        return manager;
    }
}
