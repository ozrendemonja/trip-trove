package com.triptrove.manager.application.dto;

import jakarta.validation.constraints.Size;

public record UpdateAttractionTipRequest(@Size(max = 2048, message = "Tip may not be longer then {max}")
                                         String tip
) {
}
