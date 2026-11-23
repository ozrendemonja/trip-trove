package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.AttractionToSchedule;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleAttractionRequest(
        @NotNull @Positive Long attractionId,
        @NotNull LocalDate date,
        @Pattern(regexp = "(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?")
        @Schema(description = "The chosen local start clock.", example = "09:00") String startTime,
        @Size(max = 255) String timeZone,
        @Size(max = 64) String visitDuration) {
    public AttractionToSchedule toSchedulingInput() {
        return new AttractionToSchedule(attractionId, startTime == null ? null : LocalTime.parse(startTime),
                timeZone, visitDuration);
    }
}
