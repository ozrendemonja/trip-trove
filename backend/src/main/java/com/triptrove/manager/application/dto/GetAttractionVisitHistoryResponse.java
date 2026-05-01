package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.AttractionVisit;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;

public record GetAttractionVisitHistoryResponse(Long attractionId, List<VisitHistoryEntry> visits) {

    public record VisitHistoryEntry(Long tripId,
                                    String tripName,
                                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                    LocalDate tripFromDate,
                                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                    LocalDate tripToDate,
                                    RatingDTO rating,
                                    String reviewNote) {
        public static VisitHistoryEntry from(AttractionVisit visit) {
            return new VisitHistoryEntry(
                    visit.tripId(),
                    visit.tripName(),
                    visit.tripFromDate(),
                    visit.tripToDate(),
                    RatingDTO.valueOf(visit.rating().name()),
                    visit.reviewNote()
            );
        }
    }

    public static List<GetAttractionVisitHistoryResponse> from(List<AttractionVisit> visits) {
        return visits.stream()
                .collect(Collectors.groupingBy(
                        AttractionVisit::attractionId,
                        LinkedHashMap::new,
                        Collectors.mapping(VisitHistoryEntry::from, Collectors.toList())))
                .entrySet()
                .stream()
                .map(visitHistory -> new GetAttractionVisitHistoryResponse(visitHistory.getKey(), visitHistory.getValue()))
                .toList();
    }
}
