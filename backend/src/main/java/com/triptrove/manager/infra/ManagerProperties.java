package com.triptrove.manager.infra;

import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "manager.request")
public record ManagerProperties(
        @Size(max = 100)
        int pageSize
) {
}