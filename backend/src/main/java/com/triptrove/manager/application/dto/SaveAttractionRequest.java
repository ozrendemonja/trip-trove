package com.triptrove.manager.application.dto;

import com.triptrove.manager.domain.model.Address;
import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.InformationProvider;
import com.triptrove.manager.domain.model.VisitPeriod;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.Optional;

public record SaveAttractionRequest(@NotNull Boolean isCountrywide,
                                    Integer regionId,
                                    Integer cityId,
                                    @NotBlank(message = "Attraction name may not be null or empty")
                                    @Size(max = 2048, message = "Attraction name may not be longer then {max}")
                                    String attractionName,
                                    Long mainAttractionId,
                                    @Size(max = 512, message = "Attraction address may not be longer then {max}")
                                    String attractionAddress,
                                    LocationDTO attractionLocation,
                                    @NotNull AttractionCategoryDTO attractionCategory,
                                    @NotNull AttractionTypeDTO attractionType,
                                    @NotNull boolean mustVisit,
                                    @NotNull boolean isTraditional,
                                    @Size(max = 2048, message = "Tip may not be longer then {max}")
                                    String tip,
                                    @NotBlank(message = "Attraction name may not be null or empty")
                                    @Size(max = 512, message = "Information comes from may not be longer then {max}")
                                    String infoFrom,
                                    @NotNull LocalDate infoRecorded,
                                    DateSpanDTO optimalVisitPeriod
) {

    @AssertTrue(message = "regionId or cityId is required")
    boolean isRegionIdOrCityId() {
        return regionId != null || cityId != null;
    }

    @AssertFalse(message = "regionId and cityId cannot be present simultaneously")
    boolean isRegionIdAndCityId() {
        return regionId != null && cityId != null;
    }

    public Attraction toAttraction() {
        var attraction = new Attraction();
        attraction.setCountrywide(isCountrywide);
        attraction.setName(attractionName);
        if (attractionAddress != null || attractionLocation != null) {
            attraction.setAddress(new Address(attractionAddress, Optional.ofNullable(attractionLocation).map(LocationDTO::toLocation).orElse(null)));
        }
        attraction.setCategory(attractionCategory.toAttractionCategory());
        attraction.setType(attractionType.toAttractionType());
        attraction.setMustVisit(mustVisit);
        attraction.setTraditional(isTraditional);
        attraction.setTip(tip);
        attraction.setInformationProvider(new InformationProvider(infoFrom, infoRecorded));
        if (optimalVisitPeriod != null) {
            attraction.setOptimalVisitPeriod(new VisitPeriod(optimalVisitPeriod.fromDate(), optimalVisitPeriod.toDate()));
        }

        return attraction;
    }
}
