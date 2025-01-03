package com.triptrove.manager.infra;

import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.Continent;
import com.triptrove.manager.domain.model.Suggestion;
import com.triptrove.manager.domain.repo.ContinentRepo;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

import static com.triptrove.manager.domain.model.BaseApiException.ErrorCode;

@Repository
@AllArgsConstructor
public class InMemoryContinentRepository implements ContinentRepo {
    private final HashMap<Short, Continent> inMemoryDb;
    private static short rowNumber = 0;

    @Override
    public Continent save(Continent continent) {
        if (continent.getId() == null) {
            continent.setId(rowNumber);
            return inMemoryDb.put(rowNumber++, continent);
        }
        return inMemoryDb.put(continent.getId(), continent);
    }

    @Override
    public List<Continent> findAll() {
        return inMemoryDb.values().stream().toList();
    }

    @Override
    public List<Continent> findAllOrderByUpdatedOnOrCreatedOnAsc() {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(continent -> continent.getUpdatedOn().orElse(continent.getCreatedOn())))
                .toList();
    }

    @Override
    public List<Continent> findAllOrderByUpdatedOnOrCreatedOnDesc() {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(continent -> continent.getUpdatedOn().orElse(continent.getCreatedOn()), Comparator.reverseOrder()))
                .toList();
    }

    @Override
    public void deleteByName(String name) {
        short id = inMemoryDb.values()
                .stream()
                .filter(continent -> continent.getName().equals(name))
                .map(Continent::getId)
                .findAny()
                .orElseThrow(() -> new BaseApiException("Continent not found", ErrorCode.OBJECT_NOT_FOUND));

        inMemoryDb.remove(id);
    }

    @Override
    public Optional<Continent> findByName(String name) {
        return inMemoryDb.values()
                .stream()
                .filter(continent -> continent.getName().equals(name))
                .findAny();
    }

    @Override
    public List<Suggestion> search(String query, int limit) {
        return inMemoryDb.values()
                .stream()
                .sorted(Comparator.comparing(continent -> continent.getUpdatedOn().orElse(continent.getCreatedOn()), Comparator.reverseOrder()))
                .filter(continent -> continent.getName().contains(query))
                .limit(limit)
                .map(continent -> new Suggestion(continent.getName(), Integer.valueOf(continent.getId())))
                .toList();
    }
}
