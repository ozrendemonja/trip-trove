package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.SearchInElement;
import com.triptrove.manager.domain.model.Suggestion;

import java.util.List;

public interface SearchService {
    List<Suggestion> suggestNames(String query, SearchInElement searchIn);
}
