package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.TripRangeImpactSummary;
import com.triptrove.manager.domain.model.TripRangeImpactSummary.Blocker.Kind;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.List;

public record TripRangeImpactResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate currentFromDate,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate currentToDate,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean shiftBlocked,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<Blocker> blockers) {
    @Schema(name = "TripRangeBlocker")
    public record Blocker(
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDate date,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Kind kind,
            @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String content) {
    }

    public static TripRangeImpactResponse from(TripRangeImpactSummary summary) {
        return new TripRangeImpactResponse(summary.currentFromDate(), summary.currentToDate(), summary.shiftBlocked(),
                summary.blockers().stream().map(blocker -> new Blocker(blocker.date(), blocker.kind(), blocker.content())).toList());
    }
}
