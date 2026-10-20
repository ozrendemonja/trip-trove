package com.triptrove.manager.domain.model;

public record BucketListCountsSummary(
        long all,
        long completed) {

    public long todo() {
        return all - completed;
    }
}
