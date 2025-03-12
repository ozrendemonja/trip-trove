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
@Table(name = "attraction", uniqueConstraints =
        {@UniqueConstraint(name = "UniqueNameCityOrRegion", columnNames = {"name", "city_id", "region_id"})}
)
@EntityListeners(AuditingEntityListener.class)
public class Attraction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreatedDate
    @Column(name = "created_on", updatable = false, nullable = false)
    private LocalDateTime createdOn;

    @LastModifiedDate
    @Column(name = "updated_on")
    private LocalDateTime updatedOn;

    @Column(name = "name", length = 2048, nullable = false)
    private String name;

    @ManyToOne(optional = false)
    @JoinColumn(name = "country_id")
    private Country country;

    @Column(name = "is_countrywide", nullable = false)
    private boolean isCountrywide;

    @ManyToOne(optional = false)
    @JoinColumn(name = "region_id")
    private Region region;

    @ManyToOne
    @JoinColumn(name = "city_id")
    private City city;

    @ManyToOne
    @JoinColumn(name = "main_attraction_id")
    private Attraction main;

    @OneToMany(
            mappedBy = "main",
            cascade = CascadeType.PERSIST)
    private List<Attraction> attractions;

    @Embedded
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private AttractionCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private AttractionType type;

    @Column(name = "must_visit", nullable = false)
    private boolean mustVisit;

    @Column(name = "is_traditional", nullable = false)
    private boolean isTraditional;

    @Column(name = "tip", length = 2048)
    private String tip;

    @Embedded
    private InformationProvider informationProvider;

    @Embedded
    private VisitPeriod optimalVisitPeriod;

    public Optional<LocalDateTime> getUpdatedOn() {
        return Optional.ofNullable(updatedOn);
    }

    public Optional<City> getCity() {
        return Optional.ofNullable(city);
    }

    public Optional<Address> getAddress() {
        return Optional.ofNullable(address);
    }

    public Optional<Attraction> getMain() {
        return Optional.ofNullable(main);
    }

    public Optional<String> getTip() {
        return Optional.ofNullable(tip);
    }

    public Optional<VisitPeriod> getOptimalVisitPeriod() {
        return Optional.ofNullable(optimalVisitPeriod);
    }

    public void underCity(City newCity) {
        city = newCity;
        region = newCity.getRegion();
        country = city.getRegion().getCountry();
    }

    public void underRegion(Region newRegion) {
        city = null;
        region = newRegion;
        country = newRegion.getCountry();
    }

    public boolean isUnderContinent(Continent continent) {
        return this.country.getContinent().getId().equals(continent.getId());
    }
}