package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record SaveAttractionRequest(@NotNull Integer countryId, Boolean isCountrywide,
                                    @NotNull Integer regionId,
                                    Integer cityId,
                                    @NotBlank(message = "Attraction name may not be null or empty")
                                    @Size(max = 2048, message = "Attraction name may not be longer then {max}")
                                    String attractionName,
                                    Integer mainAttractionId,
                                    @Size(max = 512, message = "Attraction address may not be longer then {max}")
                                    String attractionAddress,
                                    LocationDTO attractionLocation,
                                    @NotNull AttractionCategoryDTO attractionCategory,
                                    @NotNull AttractionTypeDTO attractionType,
                                    Boolean mustVisit,
                                    @Size(max = 2048, message = "Tip may not be longer then {max}")
                                    String tip,
                                    @NotBlank(message = "Attraction name may not be null or empty")
                                    @Size(max = 512, message = "Information comes from may not be longer then {max}")
                                    String infoFrom,
                                    @NotNull LocalDate infoRecorded,
                                    DateSpanDTO optimalVisitPeriod,
                                    Boolean isTraditional

) {
}
