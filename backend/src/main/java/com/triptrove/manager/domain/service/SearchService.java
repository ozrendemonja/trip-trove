package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.SearchInElement;

import java.util.List;

public interface SearchService {
    List<String> suggestNames(String query, SearchInElement searchIn);
}
