package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.VisitPeriod;
import jakarta.validation.Valid;

public record UpdateAttractionVisitPeriodRequest(@Valid DateSpanDTO optimalVisitPeriod) {
    public VisitPeriod toVisitPeriod() {
        if (optimalVisitPeriod != null) {
            return new VisitPeriod(optimalVisitPeriod.fromDate(), optimalVisitPeriod.toDate());
        }
        return null;
    }
}
