package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.repo.ContinentRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.HashMap;
import java.util.List;

@Repository
@AllArgsConstructor
public class InMemoryContinentRepository implements ContinentRepo {
    private final HashMap<Short, Continent> inMemoryDb;

    @Override
    public Continent save(Continent continent) {
        var id = (short) inMemoryDb.size();
        continent.setId(id);
        return inMemoryDb.put(id, continent);
    }

    @Override
    public List<Continent> findAll() {
        return inMemoryDb.values().stream().toList();
    }

    @Override
    public void deleteById(String name) {
        short id = inMemoryDb.values()
                .stream()
                .filter(continent -> continent.getName().equals(name))
                .map(Continent::getId)
                .findAny()
                .orElseThrow();

        inMemoryDb.remove(id);
    }
}
