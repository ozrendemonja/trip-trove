package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.InformationProvider;
import com.triptrove.manager.domain.model.Suggestion;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InformationProviderRepo extends JpaRepository<InformationProvider, Integer> {
    Optional<InformationProvider> findBySourceName(String sourceName);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(p.sourceName, p.id)
            FROM InformationProvider p
            WHERE cast(function('normalize_search_text', p.sourceName) as string) LIKE concat('%', :query,'%')
            ORDER BY coalesce(p.updatedOn, p.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);

    @Query("SELECT COUNT(a) > 0 FROM Attraction a WHERE a.informationProvider.id = :id")
    boolean isReferencedByAnyAttraction(Integer id);
}
