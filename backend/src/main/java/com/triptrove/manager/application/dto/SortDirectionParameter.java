package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.SortDirection;

public enum SortDirectionParameter {
    ASC,
    DESC;

    public SortDirection toSortDirection() {
        return switch (this) {
            case ASC -> SortDirection.ASCENDING;
            case DESC -> SortDirection.DESCENDING;
        };
    }
}
