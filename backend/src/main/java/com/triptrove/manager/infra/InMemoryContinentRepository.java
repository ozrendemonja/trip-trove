package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.repo.ContinentRepo;
import org.springframework.stereotype.Repository;

import java.util.HashMap;

@Repository
public class InMemoryContinentRepository implements ContinentRepo {
    private final HashMap<Short, Continent> inMemoryDb = new HashMap<>();

    @Override
    public Continent save(Continent continent) {
        var id = (short) inMemoryDb.size();
        continent.setId(id);
        return inMemoryDb.put(id, continent);
    }
}
