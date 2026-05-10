package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SaveCountryRequest(
        @NotBlank(message = "Continent name may not be null or empty")
        @Size(max = 64, message = "Continent name may not be longer then {max}")
        String continentName,
        @NotBlank(message = "Country name may not be null or empty")
        @Size(max = 256, message = "Country name may not be longer then {max}")
        String countryName,
        @NotBlank(message = "ISO code may not be null or empty")
        @Pattern(regexp = "^$|^[A-Za-z]{2}$", message = "ISO code must be a 2-letter ISO 3166-1 alpha-2 code")
        String isoCode) {
}
