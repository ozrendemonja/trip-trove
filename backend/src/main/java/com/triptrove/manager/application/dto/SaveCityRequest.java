package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SaveCityRequest(@NotBlank(message = "City name may not be null or empty")
                              @Size(max = 256, message = "City name may not be longer then {max}")
                              String cityName,
                              @NotNull
                              Integer regionId) {
}
