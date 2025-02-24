package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.Suggestion;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContinentRepo extends JpaRepository<Continent, Short> {
    @Query("""
            SELECT c FROM Continent c ORDER BY
            coalesce(c.updatedOn, c.createdOn) DESC
            """)
    List<Continent> findAllOrderByUpdatedOnOrCreatedOnDesc();

    @Query("""
            SELECT c FROM Continent c ORDER BY
            coalesce(c.updatedOn, c.createdOn) ASC
            """)
    List<Continent> findAllOrderByUpdatedOnOrCreatedOnAsc();

    int deleteByName(String name);

    Optional<Continent> findByName(String name);

    @Query("""
            SELECT new com.triptrove.manager.domain.model.Suggestion(c.name, CAST(c.id AS int)) FROM Continent c WHERE c.name LIKE %:query%
            ORDER BY coalesce(c.updatedOn, c.createdOn) DESC
            """)
    List<Suggestion> findByNameContainingQueryOrderByUpdatedOnOrCreatedOnDesc(String query, Limit limit);
}
