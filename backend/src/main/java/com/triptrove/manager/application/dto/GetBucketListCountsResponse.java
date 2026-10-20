package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.BucketListCountsSummary;

public record GetBucketListCountsResponse(
        long all,
        long todo,
        long completed) {

    public static GetBucketListCountsResponse from(BucketListCountsSummary counts) {
        return new GetBucketListCountsResponse(counts.all(), counts.todo(), counts.completed());
    }
}
