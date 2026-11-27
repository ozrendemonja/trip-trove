package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.AttractionToSchedule;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ScheduleAttractionRequest(
        @NotNull @Positive Long attractionId,
        @NotNull LocalDate date,
        @Pattern(regexp = LOCAL_CLOCK_PATTERN)
        @Schema(description = "The chosen local start clock.", example = "09:00") String startTime,
        @Size(max = 255) String timeZone,
        @Size(max = 64) String visitDuration,
        @Size(max = 9) @Schema(description = "Offset of an unchanged gap suggestion in a repeated hour.") String startOffset,
        List<@NotNull @Valid ItineraryTransferDTO> transfersToRemove) {
    static final String LOCAL_CLOCK_PATTERN = "(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?";

    public ScheduleAttractionRequest(Long attractionId, LocalDate date, String startTime, String timeZone,
                                     String visitDuration) {
        this(attractionId, date, startTime, timeZone, visitDuration, null, null);
    }

    public ScheduleAttractionRequest(Long attractionId, LocalDate date, String startTime, String timeZone,
                                     String visitDuration, String startOffset) {
        this(attractionId, date, startTime, timeZone, visitDuration, startOffset, null);
    }

    public AttractionToSchedule toSchedulingInput() {
        return new AttractionToSchedule(attractionId, startTime == null ? null : LocalTime.parse(startTime),
                timeZone, visitDuration, startOffset, ItineraryTransferDTO.toSummaries(transfersToRemove));
    }
}
