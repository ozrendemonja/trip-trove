package com.triptrove.manager.domain.model;

public enum AttractionVisitStatus {
    /** Never visited in any trip. */
    NOT_VISITED,
    /** Visited, and the most recent visit is flagged as worth returning to. */
    VISITED_WANT_RETURN,
    /** Visited, but the most recent visit is not flagged for a return. */
    VISITED_DONE
}
