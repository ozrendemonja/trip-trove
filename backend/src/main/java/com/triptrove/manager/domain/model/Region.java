package com.triptrove.manager.domain.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Getter
@Setter
@Entity
@Table(name = "region", uniqueConstraints =
        {@UniqueConstraint(name = "UniqueNameAndCountry", columnNames = {"name", "country_id"})}
)
@EntityListeners(AuditingEntityListener.class)
public class Region {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @CreatedDate
    @Column(name = "created_on", updatable = false, nullable = false)
    private LocalDateTime createdOn;

    @LastModifiedDate
    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "name", length = 256, nullable = false)
    private String name;

    @ManyToOne(optional = false)
    @JoinColumn(name = "country_id")
    private Country country;

    @OneToMany(
            mappedBy = "region",
            cascade = CascadeType.PERSIST)
    private List<Attraction> attractions;

    public Optional<LocalDateTime> getUpdatedOn() {
        return Optional.ofNullable(updatedOn);
    }

}