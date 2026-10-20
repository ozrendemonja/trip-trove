package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.BucketListStatusFilter;

public enum BucketListStatusParameter {
    ALL,
    TODO,
    COMPLETED;

    public BucketListStatusFilter toStatusFilter() {
        return switch (this) {
            case ALL -> BucketListStatusFilter.ALL;
            case TODO -> BucketListStatusFilter.TODO;
            case COMPLETED -> BucketListStatusFilter.COMPLETED;
        };
    }
}
