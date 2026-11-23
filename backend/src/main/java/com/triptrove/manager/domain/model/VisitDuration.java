package com.triptrove.manager.domain.model;

import java.util.OptionalInt;
import java.util.regex.Pattern;

public final class VisitDuration {
    // Match the browser's whitespace rules, including pasted nonbreaking spaces.
    private static final String SPACE = "[\\p{Z}\\x09-\\x0D\\uFEFF]";
    private static final Pattern PADDING = Pattern.compile("\\A" + SPACE + "+|" + SPACE + "+\\z");
    private static final Pattern LENGTH = Pattern.compile("(?:(\\d+)h" + SPACE + "*)?(?:(\\d+)m)?");
    private static final Pattern SHARED_UNIT = Pattern.compile("(\\d+)" + SPACE + "*-" + SPACE + "*(\\d+)([hm])");

    private VisitDuration() {
    }

    public static OptionalInt upperBound(String input) {
        if (input == null) {
            return OptionalInt.empty();
        }
        var value = trim(input);
        var sharedUnit = SHARED_UNIT.matcher(value);
        if (sharedUnit.matches()) {
            return rangeUpperBound(sharedUnit.group(1) + sharedUnit.group(3), sharedUnit.group(2) + sharedUnit.group(3));
        }
        var separator = value.indexOf('-');
        return separator < 0 ? minutes(value)
                : rangeUpperBound(trim(value.substring(0, separator)), trim(value.substring(separator + 1)));
    }

    private static String trim(String value) {
        return PADDING.matcher(value).replaceAll("");
    }

    private static OptionalInt rangeUpperBound(String lower, String upper) {
        var from = minutes(lower);
        var to = minutes(upper);
        return from.isPresent() && to.isPresent() && from.getAsInt() <= to.getAsInt() ? to : OptionalInt.empty();
    }

    private static OptionalInt minutes(String value) {
        var amount = LENGTH.matcher(value);
        if (!amount.matches() || (amount.group(1) == null && amount.group(2) == null)) {
            return OptionalInt.empty();
        }
        try {
            var hours = amount.group(1) == null ? 0 : Integer.parseInt(amount.group(1));
            var minutes = amount.group(2) == null ? 0 : Integer.parseInt(amount.group(2));
            return OptionalInt.of(Math.addExact(Math.multiplyExact(hours, 60), minutes));
        } catch (NumberFormatException | ArithmeticException outOfRange) {
            return OptionalInt.empty();
        }
    }
}
