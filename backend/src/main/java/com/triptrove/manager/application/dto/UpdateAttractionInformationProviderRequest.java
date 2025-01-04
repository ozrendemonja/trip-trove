package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateAttractionInformationProviderRequest(@NotBlank(message = "Attraction name may not be null or empty")
                                                         @Size(max = 512, message = "Information comes from may not be longer then {max}")
                                                         String infoFrom,
                                                         @NotNull LocalDate infoRecorded) {
}
