package com.triptrove.manager.infra;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI springShopOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("TripTrove Manager API")
                        .description("Trip attractions manager")
                        // TODO Change when deploying
                        .version(LocalDateTime.now().format(DateTimeFormatter.ofPattern("ddMMyyyy-HHmm")))
                );
    }
}
