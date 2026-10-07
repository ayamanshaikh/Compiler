package com.codevista.admin.dto;

public class AdminMetricsResponse {

    private long heapUsedBytes;
    private long heapMaxBytes;
    private long heapTotalBytes;
    private long heapFreeBytes;
    private double heapUsedMb;
    private double heapMaxMb;
    private long uptimeMillis;
    private String uptimeFormatted;
    private int availableProcessors;
    private int threadCount;
    private long totalTopics;
    private long totalQuestions;
    private long totalUsers;
    private long studentsCount;
    private long instructorsCount;
    private long adminsCount;
    private String compilationEngineStatus;
    private String compilationEngineName;
    private int guestAttempts;
    private int guestCorrect;
    private int guestIncorrect;
    private long totalCacheEntries;
    private long cacheHits;
    private long cacheMisses;
    private double cacheHitRatio;
    private java.util.Map<String, Integer> cacheEntryCounts;

    public AdminMetricsResponse() {
    }

    public long getHeapUsedBytes() {
        return heapUsedBytes;
    }

    public void setHeapUsedBytes(long heapUsedBytes) {
        this.heapUsedBytes = heapUsedBytes;
    }

    public long getHeapMaxBytes() {
        return heapMaxBytes;
    }

    public void setHeapMaxBytes(long heapMaxBytes) {
        this.heapMaxBytes = heapMaxBytes;
    }

    public long getHeapTotalBytes() {
        return heapTotalBytes;
    }

    public void setHeapTotalBytes(long heapTotalBytes) {
        this.heapTotalBytes = heapTotalBytes;
    }

    public long getHeapFreeBytes() {
        return heapFreeBytes;
    }

    public void setHeapFreeBytes(long heapFreeBytes) {
        this.heapFreeBytes = heapFreeBytes;
    }

    public double getHeapUsedMb() {
        return heapUsedMb;
    }

    public void setHeapUsedMb(double heapUsedMb) {
        this.heapUsedMb = heapUsedMb;
    }

    public double getHeapMaxMb() {
        return heapMaxMb;
    }

    public void setHeapMaxMb(double heapMaxMb) {
        this.heapMaxMb = heapMaxMb;
    }

    public long getUptimeMillis() {
        return uptimeMillis;
    }

    public void setUptimeMillis(long uptimeMillis) {
        this.uptimeMillis = uptimeMillis;
    }

    public String getUptimeFormatted() {
        return uptimeFormatted;
    }

    public void setUptimeFormatted(String uptimeFormatted) {
        this.uptimeFormatted = uptimeFormatted;
    }

    public int getAvailableProcessors() {
        return availableProcessors;
    }

    public void setAvailableProcessors(int availableProcessors) {
        this.availableProcessors = availableProcessors;
    }

    public int getThreadCount() {
        return threadCount;
    }

    public void setThreadCount(int threadCount) {
        this.threadCount = threadCount;
    }

    public long getTotalTopics() {
        return totalTopics;
    }

    public void setTotalTopics(long totalTopics) {
        this.totalTopics = totalTopics;
    }

    public long getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(long totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getStudentsCount() {
        return studentsCount;
    }

    public void setStudentsCount(long studentsCount) {
        this.studentsCount = studentsCount;
    }

    public long getInstructorsCount() {
        return instructorsCount;
    }

    public void setInstructorsCount(long instructorsCount) {
        this.instructorsCount = instructorsCount;
    }

    public long getAdminsCount() {
        return adminsCount;
    }

    public void setAdminsCount(long adminsCount) {
        this.adminsCount = adminsCount;
    }

    public String getCompilationEngineStatus() {
        return compilationEngineStatus;
    }

    public void setCompilationEngineStatus(String compilationEngineStatus) {
        this.compilationEngineStatus = compilationEngineStatus;
    }

    public String getCompilationEngineName() {
        return compilationEngineName;
    }

    public void setCompilationEngineName(String compilationEngineName) {
        this.compilationEngineName = compilationEngineName;
    }

    public int getGuestAttempts() {
        return guestAttempts;
    }

    public void setGuestAttempts(int guestAttempts) {
        this.guestAttempts = guestAttempts;
    }

    public int getGuestCorrect() {
        return guestCorrect;
    }

    public void setGuestCorrect(int guestCorrect) {
        this.guestCorrect = guestCorrect;
    }

    public int getGuestIncorrect() {
        return guestIncorrect;
    }

    public void setGuestIncorrect(int guestIncorrect) {
        this.guestIncorrect = guestIncorrect;
    }

    public long getTotalCacheEntries() {
        return totalCacheEntries;
    }

    public void setTotalCacheEntries(long totalCacheEntries) {
        this.totalCacheEntries = totalCacheEntries;
    }

    public long getCacheHits() {
        return cacheHits;
    }

    public void setCacheHits(long cacheHits) {
        this.cacheHits = cacheHits;
    }

    public long getCacheMisses() {
        return cacheMisses;
    }

    public void setCacheMisses(long cacheMisses) {
        this.cacheMisses = cacheMisses;
    }

    public double getCacheHitRatio() {
        return cacheHitRatio;
    }

    public void setCacheHitRatio(double cacheHitRatio) {
        this.cacheHitRatio = cacheHitRatio;
    }

    public java.util.Map<String, Integer> getCacheEntryCounts() {
        return cacheEntryCounts;
    }

    public void setCacheEntryCounts(java.util.Map<String, Integer> cacheEntryCounts) {
        this.cacheEntryCounts = cacheEntryCounts;
    }
}
