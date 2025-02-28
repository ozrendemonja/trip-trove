package com.triptrove.manager.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Getter
@Setter
@Entity
@Table(name = "continent")
public class Continent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Short id;

    @Column(name = "created_on", updatable = false, nullable = false)
    private LocalDateTime createdOn;

    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "name", length = 64, nullable = false, unique = true)
    private String name;

    @OneToMany(
            mappedBy = "continent",
            cascade = CascadeType.PERSIST)
    private List<Country> countries;

    @PrePersist
    protected void onCreate() {
        createdOn = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedOn = LocalDateTime.now();
    }


    public Optional<LocalDateTime> getUpdatedOn() {
        return Optional.ofNullable(updatedOn);
    }
}
