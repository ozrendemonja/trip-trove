package com.triptrove.manager.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Optional;

@Getter
@Setter
public class City {
    private Integer id;
    private LocalDateTime createdOn = LocalDateTime.now();
    private LocalDateTime updatedOn;
    private String name;
    private Region region;

    public Optional<LocalDateTime> getUpdatedOn() {
        return Optional.ofNullable(updatedOn);
    }
}
