package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateRegionDetailsRequest(@NotBlank(message = "Region name may not be null or empty")
                                         @Size(max = 256, message = "Region name may not be longer then {max}")
                                         String regionName) {
}
