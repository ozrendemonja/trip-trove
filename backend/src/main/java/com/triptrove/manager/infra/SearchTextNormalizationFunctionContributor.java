package com.triptrove.manager.infra;

import com.triptrove.manager.domain.search.SearchTextNormalizer;
import org.hibernate.boot.model.FunctionContributions;
import org.hibernate.boot.model.FunctionContributor;
import org.hibernate.type.StandardBasicTypes;

/**
 * Registers the {@code normalize_search_text} HQL/SQL function so repositories can write
 * {@code function('normalize_search_text', alias.field)} without hard coding the character
 * mapping or the JPQL alias inside shared constant.
 */
public class SearchTextNormalizationFunctionContributor implements FunctionContributor {

    @Override
    public void contributeFunctions(FunctionContributions functionContributions) {
        functionContributions.getFunctionRegistry()
                .patternDescriptorBuilder(
                        SearchTextNormalizer.SQL_FUNCTION_NAME,
                        SearchTextNormalizer.SQL_FUNCTION_PATTERN)
                .setExactArgumentCount(1)
                .setInvariantType(
                        functionContributions.getTypeConfiguration()
                                .getBasicTypeRegistry()
                                .resolve(StandardBasicTypes.STRING))
                .register();
    }
}
