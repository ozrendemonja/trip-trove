package com.triptrove.manager.application.dto;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public record DateSpanResponse(@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                               LocalDate fromDate,
                               @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                               LocalDate toDate) {
}
