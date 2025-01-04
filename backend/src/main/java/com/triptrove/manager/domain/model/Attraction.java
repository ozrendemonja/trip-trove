package com.triptrove.manager.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Optional;

@Getter
@Setter
public class Attraction {
    private Long id;
    private LocalDateTime createdOn = LocalDateTime.now();
    private LocalDateTime updatedOn;

    private String name;
    private Country country;
    private boolean isCountrywide;
    private Region region;
    private City city;
    private Attraction main;
    private Address address;
    private AttractionCategory category;
    private AttractionType type;
    private boolean mustVisit;
    private boolean isTraditional;
    private String tip;
    private InformationProvider informationProvider;
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

    public void setCity(City newCity) {
        city = newCity;
        region = newCity.getRegion();
        country = city.getRegion().getCountry();
    }

    public void setRegion(Region newRegion) {
        city = null;
        region = newRegion;
        country = newRegion.getCountry();
    }
}