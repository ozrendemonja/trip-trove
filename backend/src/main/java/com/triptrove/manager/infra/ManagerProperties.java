package com.triptrove.manager.infra;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "manager.request")
public record ManagerProperties(
        @Min(1) @Max(100)
        int pageSize,
        @Min(1) @Max(20)
        int suggestionLimit,
        @Min(1) @Max(200)
        int totalCountries
) {
}