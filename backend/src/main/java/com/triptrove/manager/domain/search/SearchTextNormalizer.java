package com.triptrove.manager.domain.search;

import java.util.Locale;

public final class SearchTextNormalizer {
    /**
     * Diacritic characters folded by {@link #normalize(String)} into their ASCII
     * counterparts in {@link #DIACRITIC_FOLDED_TO_ASCII}.
     * Single character pairs only; multi character mappings (e.g. {@code đ -> dj})
     * are applied separately in {@link #normalize(String)} and {@link #SQL_FUNCTION_PATTERN}.
     */
    public static final String DIACRITIC_CHARS = "šžčć";
    public static final String DIACRITIC_FOLDED_TO_ASCII = "szcc";

    /**
     * Name of the HQL/SQL function that normalizes text for search
     * (lower-case + diacritic folding).
     * Use it inside repository {@code @Query} annotations as
     * {@code function('normalize_search_text', alias.field)} so the alias stays local to each query.
     */
    public static final String SQL_FUNCTION_NAME = "normalize_search_text";

    /**
     * SQL pattern registered with Hibernate for {@link #SQL_FUNCTION_NAME}.
     * {@code ?1} is the field expression to normalize.
     */
    public static final String SQL_FUNCTION_PATTERN =
            "translate(replace(lower(?1), 'đ', 'dj'), '" + DIACRITIC_CHARS + "', '" + DIACRITIC_FOLDED_TO_ASCII + "')";

    private SearchTextNormalizer() {
    }

    /**
     * Java side counterpart of the {@code normalize_search_text} SQL function.
     * Lower-cases the value and folds diacritics so that user typed search input
     * and stored text reduce to the same canonical form (e.g. {@code Švedska} and
     * {@code Svedska} both become {@code svedska}).
     */
    public static String normalizeForSearch(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replace("đ", "dj")
                .replace("š", "s")
                .replace("ž", "z")
                .replace("č", "c")
                .replace("ć", "c");
    }
}