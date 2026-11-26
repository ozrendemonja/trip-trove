package com.triptrove.manager.domain.model;

import com.triptrove.manager.domain.model.WatchedSourceChangeSummary.Field;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public record WatchedSourceSnapshot(Map<Field, String> values, Map<Field, String> labels, Map<Field, Long> versions) {
    public List<WatchedSourceChangeSummary> changesFrom(WatchedSourceSnapshot baseline) {
        return Arrays.stream(Field.values())
                .filter(field -> !Objects.equals(baseline.versions.get(field), versions.get(field)))
                .map(field -> new WatchedSourceChangeSummary(field, baseline.label(field), label(field),
                        Objects.equals(baseline.values.get(field), values.get(field))))
                .toList();
    }

    private String label(Field field) {
        return labels.getOrDefault(field, values.get(field));
    }
}
