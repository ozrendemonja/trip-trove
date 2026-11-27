package com.triptrove.manager.domain.model;

import com.triptrove.manager.domain.model.ItineraryDetails.EntryWarning;

import java.util.List;

public record ItineraryGroupedAttractionSummary(long attractionId, String name, TripAttractionGroup attractionGroup,
                                                boolean mustVisit, AttractionCategory category,
                                                int contributionMinutes, String workingHours, String visitDuration,
                                                String tripNote, List<EntryWarning> warnings) {
}
