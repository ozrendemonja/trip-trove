package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateCountryIsoCodeRequest(
        @NotBlank(message = "ISO code may not be null or empty")
        @Pattern(regexp = "^$|^[A-Za-z]{2}$", message = "ISO code must be a 2-letter ISO 3166-1 alpha-2 code")
        String isoCode) {
}
