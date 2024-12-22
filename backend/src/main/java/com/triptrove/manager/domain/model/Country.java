package com.triptrove.manager.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Optional;

@Getter
@Setter
public class Country {
    private Integer id;
    private LocalDateTime createdOn = LocalDateTime.now();
    private LocalDateTime updatedOn;
    private String name;
    private Continent continent;

    public Optional<LocalDateTime> getUpdatedOn() {
        return Optional.ofNullable(updatedOn);
    }
}
