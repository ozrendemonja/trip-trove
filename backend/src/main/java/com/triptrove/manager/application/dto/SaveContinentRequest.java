package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveContinentRequest(
        @NotBlank(message = "Continent name may not be null or empty")
        @Size(max=64, message = "Continent name may not be longer then {max}")
        String continentName)
{}