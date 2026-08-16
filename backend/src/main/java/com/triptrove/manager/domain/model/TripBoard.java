package com.triptrove.manager.domain.model;

import com.triptrove.manager.domain.algorithm.FractionalIndexing;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public final class TripBoard {
    private TripBoard() {
    }

    public static void moveAttraction(TripAttraction attraction,
                                      TripAttractionGroup targetGroup,
                                      TripAttraction previous,
                                      TripAttraction next) {
        validateMove(attraction, targetGroup, previous, next);
        attraction.setAttractionGroup(targetGroup);
        attraction.setBoardPosition(positionForMove(attraction, previous, next));
    }

    public static List<TripAttraction> arrange(List<TripAttraction> currentAttractions,
                                               List<TripBoardItem> requestedItems) {
        var currentBoard = buildCurrentBoardIndex(currentAttractions);
        var changedAttractions = new LinkedHashMap<Long, TripAttraction>();
        var requestedBoard = prepareRequestedBoard(
                requestedItems,
                currentBoard.attractionsById(),
                changedAttractions);

        validateRequestedBoardIsComplete(currentBoard, requestedBoard);
        arrangeRequestedColumns(currentBoard, requestedBoard, changedAttractions);

        return new ArrayList<>(changedAttractions.values());
    }

    private static CurrentBoard buildCurrentBoardIndex(List<TripAttraction> currentAttractions) {
        var attractionsById = currentAttractions.stream()
                .collect(Collectors.toMap(
                        attraction -> attraction.getAttraction().getId(),
                        Function.identity(),
                        (existingAttraction, replacementAttraction) -> replacementAttraction,
                        HashMap::new));

        var positionsByColumn = currentAttractions.stream()
                .collect(Collectors.groupingBy(
                        attraction -> boardColumn(attraction, attraction.getAttractionGroup()),
                        HashMap::new,
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                TripBoard::indexAttractionPositions)));

        return new CurrentBoard(attractionsById, positionsByColumn);
    }

    private static Map<Long, Integer> indexAttractionPositions(List<TripAttraction> attractions) {
        return IntStream.range(0, attractions.size())
                .boxed()
                .collect(Collectors.toMap(
                        index -> attractions.get(index).getAttraction().getId(),
                        Function.identity(),
                        (existingPosition, replacementPosition) -> replacementPosition,
                        HashMap::new));
    }

    private static RequestedBoard prepareRequestedBoard(
            List<TripBoardItem> requestedItems,
            Map<Long, TripAttraction> currentAttractionsById,
            Map<Long, TripAttraction> changedAttractions) {
        var requestedIds = new HashSet<Long>();
        var attractionsByColumn = new LinkedHashMap<BoardColumn, List<TripAttraction>>();
        for (var item : requestedItems) {
            validateAttractionIsRequestedOnce(item.attractionId(), requestedIds);
            var attraction = findCurrentAttraction(item.attractionId(), currentAttractionsById);
            changeAttractionGroupIfNeeded(attraction, item.group(), changedAttractions);

            var targetColumn = boardColumn(attraction, item.group());
            attractionsByColumn.computeIfAbsent(targetColumn, ignored -> new ArrayList<>())
                    .add(attraction);
        }
        return new RequestedBoard(requestedIds, attractionsByColumn);
    }

    private static void validateAttractionIsRequestedOnce(Long attractionId,
                                                          HashSet<Long> requestedIds) {
        if (!requestedIds.add(attractionId)) {
            throw new BaseApiException("Trip board contains duplicate attraction ids", BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        }
    }

    private static TripAttraction findCurrentAttraction(Long attractionId,
                                                        Map<Long, TripAttraction> currentAttractionsById) {
        var attraction = currentAttractionsById.get(attractionId);
        if (attraction == null) {
            throw new BaseApiException("Attraction not found under trip in the database", BaseApiException.ErrorCode.OBJECT_NOT_FOUND);
        }
        return attraction;
    }

    private static void changeAttractionGroupIfNeeded(
            TripAttraction attraction,
            TripAttractionGroup requestedGroup,
            Map<Long, TripAttraction> changedAttractions) {
        if (attraction.getAttractionGroup() != requestedGroup) {
            attraction.setAttractionGroup(requestedGroup);
            changedAttractions.put(attraction.getAttraction().getId(), attraction);
        }
    }

    private static void validateRequestedBoardIsComplete(CurrentBoard currentBoard,
                                                         RequestedBoard requestedBoard) {
        if (requestedBoard.attractionIds().size() != currentBoard.attractionsById().size()) {
            throw new BaseApiException("Trip board must contain every attraction under the trip", BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        }
    }

    private static void arrangeRequestedColumns(
            CurrentBoard currentBoard,
            RequestedBoard requestedBoard,
            Map<Long, TripAttraction> changedAttractions) {
        for (var entry : requestedBoard.attractionsByColumn().entrySet()) {
            var currentPositions = currentBoard.positionsByColumn().getOrDefault(entry.getKey(), Map.of());
            arrangeColumn(entry.getValue(), currentPositions, changedAttractions);
        }
    }

    private static void validateMove(TripAttraction attraction,
                                     TripAttractionGroup targetGroup,
                                     TripAttraction previous,
                                     TripAttraction next) {
        validateAttractionsAreDistinct(attraction, previous, next);
        validateNeighborsAreInTargetColumn(attraction, targetGroup, previous, next);
        validatePreviousPrecedesNext(previous, next);
    }

    private static void validateAttractionsAreDistinct(TripAttraction attraction,
                                                       TripAttraction previous,
                                                       TripAttraction next) {
        var attractionId = attraction.getAttraction().getId();
        var previousId = previous == null ? null : previous.getAttraction().getId();
        var nextId = next == null ? null : next.getAttraction().getId();
        if (attractionId.equals(previousId) || attractionId.equals(nextId)
                || previousId != null && previousId.equals(nextId)) {
            throw new BaseApiException("Attraction move contains duplicate attraction ids", BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        }
    }

    private static void validateNeighborsAreInTargetColumn(TripAttraction attraction,
                                                           TripAttractionGroup targetGroup,
                                                           TripAttraction previous,
                                                           TripAttraction next) {
        var targetColumn = boardColumn(attraction, targetGroup);
        validateNeighborIsInTargetColumn(previous, targetColumn);
        validateNeighborIsInTargetColumn(next, targetColumn);
    }

    private static void validatePreviousPrecedesNext(TripAttraction previous,
                                                     TripAttraction next) {
        if (previous != null && next != null
                && previous.getBoardPosition().compareTo(next.getBoardPosition()) >= 0) {
            throw new BaseApiException("Previous attraction must precede next attraction", BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        }
    }

    private static void validateNeighborIsInTargetColumn(TripAttraction neighbor,
                                                         BoardColumn targetColumn) {
        if (neighbor != null && !boardColumn(neighbor, neighbor.getAttractionGroup()).equals(targetColumn)) {
            throw new BaseApiException("Attraction neighbor is outside the target board column", BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        }
    }

    private static BigDecimal positionForMove(TripAttraction attraction,
                                              TripAttraction previous,
                                              TripAttraction next) {
        if (previous == null && next == null) {
            return attraction.getBoardPosition();
        }
        if (previous == null) {
            return FractionalIndexing.indexBefore(next.getBoardPosition());
        }
        if (next == null) {
            return FractionalIndexing.indexAfter(previous.getBoardPosition());
        }
        return FractionalIndexing.indexBetween(previous.getBoardPosition(), next.getBoardPosition());
    }

    private static void arrangeColumn(List<TripAttraction> attractions,
                                      Map<Long, Integer> currentPositions,
                                      Map<Long, TripAttraction> changedAttractions) {
        var indexUpdates = FractionalIndexing.calculateIndexUpdates(
                attractions,
                attraction -> currentPositions.get(attraction.getAttraction().getId()),
                TripAttraction::getBoardPosition);
        for (var indexUpdate : indexUpdates) {
            var attraction = indexUpdate.item();
            attraction.setBoardPosition(indexUpdate.index());
            changedAttractions.put(attraction.getAttraction().getId(), attraction);
        }
    }

    private static BoardColumn boardColumn(TripAttraction tripAttraction,
                                           TripAttractionGroup group) {
        var attraction = tripAttraction.getAttraction();
        var city = attraction.getCity();
        if (city.isPresent()) {
            return new BoardColumn(DestinationType.CITY, city.get().getId(), group);
        }

        var region = attraction.getRegion();
        return new BoardColumn(DestinationType.REGION, region.getId(), group);
    }

    private enum DestinationType {
        CITY,
        REGION
    }

    private record BoardColumn(DestinationType destinationType,
                               Integer destinationId,
                               TripAttractionGroup group) {
    }

    private record CurrentBoard(Map<Long, TripAttraction> attractionsById,
                                Map<BoardColumn, Map<Long, Integer>> positionsByColumn) {
    }

    private record RequestedBoard(HashSet<Long> attractionIds,
                                  Map<BoardColumn, List<TripAttraction>> attractionsByColumn) {
    }
}