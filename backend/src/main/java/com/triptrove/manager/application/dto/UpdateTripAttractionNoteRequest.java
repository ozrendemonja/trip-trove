package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.Size;

public record UpdateTripAttractionNoteRequest(
        @Size(max = 512, message = "Note may not be longer then 512")
        String note) {
}
