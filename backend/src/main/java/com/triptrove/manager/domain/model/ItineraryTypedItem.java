package com.triptrove.manager.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Embeddable
public record ItineraryTypedItem(
        @Column(name = "item_kind", length = 32) @Enumerated(EnumType.STRING) ItineraryItemKind kind,
        @Column(name = "item_name") String name,
        @Column(name = "item_note", length = 512) String note) {
    public ItineraryTypedItem {
        if (kind == null || name == null || name.isBlank() || name.length() > 255) {
            throw new IllegalArgumentException("A typed item needs a kind and a name of at most 255 characters");
        }
        name = name.strip();
        if (note != null && note.length() > 512) {
            throw new IllegalArgumentException("An entry note must not exceed 512 characters");
        }
        if ("".equals(note)) {
            note = null;
        }
    }
}
