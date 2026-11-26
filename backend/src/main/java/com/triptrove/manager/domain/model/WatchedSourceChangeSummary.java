package com.triptrove.manager.domain.model;

public record WatchedSourceChangeSummary(Field field, String baseline, String current, boolean restored) {
    public enum Field {
        WORKING_HOURS, VISIT_DURATION, MUST_VISIT, IMPORTANCE, TRIP_NOTE,
        ADDRESS, LOCATION, GEOGRAPHY, MAIN_ATTRACTION, CATEGORY, TYPE, CATALOGUE_TIP,
        OPTIMAL_VISIT_PERIOD, PERMANENT_CLOSURE
    }
}
