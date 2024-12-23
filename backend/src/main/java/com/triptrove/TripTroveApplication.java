package com.triptrove;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TripTroveApplication {

    public static void main(String[] args) {
        SpringApplication.run(TripTroveApplication.class, args);
    }

}
