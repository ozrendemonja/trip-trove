package com.triptrove.manager.domain.model;

public enum BucketListStatusFilter {
    ALL(true, true),
    TODO(true, false),
    COMPLETED(false, true);

    private final boolean includesTodo;
    private final boolean includesCompleted;

    BucketListStatusFilter(boolean includesTodo, boolean includesCompleted) {
        this.includesTodo = includesTodo;
        this.includesCompleted = includesCompleted;
    }

    public boolean includesTodo() {
        return includesTodo;
    }

    public boolean includesCompleted() {
        return includesCompleted;
    }
}
