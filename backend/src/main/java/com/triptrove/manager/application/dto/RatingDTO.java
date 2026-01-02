package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Rating;

public enum RatingDTO {
    DISLIKED, BELOW_AVERAGE, AVERAGE, VERY_GOOD, EXCELLENT;

    public Rating toRating() {
        return Rating.valueOf(this.name());
    }
}
