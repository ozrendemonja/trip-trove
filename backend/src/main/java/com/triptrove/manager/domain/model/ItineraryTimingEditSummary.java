package com.triptrove.manager.domain.model;

import java.time.LocalDate;

public record ItineraryTimingEditSummary(ItineraryEntry entry, String name, String visitDuration,
                                         LocalDate tripStart, LocalDate tripEnd, String itineraryZone,
                                         int lastMemberPosition, long contributionMinutes,
                                         ItineraryTiming shortenedHostTiming) {
    public ItineraryTimingEditSummary(ItineraryEntry entry, String name, String visitDuration,
                                      LocalDate tripStart, LocalDate tripEnd, String itineraryZone,
                                      int lastMemberPosition, long contributionMinutes) {
        this(entry, name, visitDuration, tripStart, tripEnd, itineraryZone, lastMemberPosition, contributionMinutes, null);
    }

    public ItineraryTiming timing() {
        return shortenedHostTiming == null ? entry.getTiming() : shortenedHostTiming;
    }

    public ItineraryTimingEditSummary withShortenedHostTiming(ItineraryTiming timing) {
        return new ItineraryTimingEditSummary(entry, name, visitDuration, tripStart, tripEnd,
                itineraryZone, lastMemberPosition, contributionMinutes, timing);
    }
}
