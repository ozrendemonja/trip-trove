package com.triptrove.manager.domain.repo;

import com.triptrove.manager.domain.model.Continent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContinentRepo extends JpaRepository<Continent, Short> {
    @Query("""
            SELECT c FROM Continent c ORDER BY
            CASE WHEN c.updatedOn IS NULL THEN c.createdOn ELSE c.updatedOn END DESC
            """)
    List<Continent> findAllOrderByUpdatedOnOrCreatedOnDesc();

    @Query("""
            SELECT c FROM Continent c ORDER BY
            CASE WHEN c.updatedOn IS NULL THEN c.createdOn ELSE c.updatedOn END ASC
            """)
    List<Continent> findAllOrderByUpdatedOnOrCreatedOnAsc();

    int deleteByName(String name);

    Optional<Continent> findByName(String name);

//    List<Suggestion> search(String query, int limit);
}
