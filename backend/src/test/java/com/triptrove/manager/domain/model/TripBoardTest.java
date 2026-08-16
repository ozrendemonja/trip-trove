package com.triptrove.manager.domain.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TripBoardTest {
    @Test
    void arrangingEmptyBoardShouldReturnNoChanges() {
        var changes = TripBoard.arrange(List.of(), List.of());

        assertThat(changes).isEmpty();
    }

    @Test
    void arrangingSingleItemBoardShouldReturnNoChanges() {
        var onlyAttraction = tripAttraction(
                1L, "1", TripAttractionGroup.PRIMARY, 1, "City");

        var changes = TripBoard.arrange(List.of(onlyAttraction), List.of(
                new TripBoardItem(1L, TripAttractionGroup.PRIMARY)));

        assertThat(changes).isEmpty();
    }

    @Test
    void arrangingBoardShouldKeepSameNamedDestinationsIndependent() {
        var firstInFirstCity = tripAttraction(
                1L, "1", TripAttractionGroup.PRIMARY, 1, "Springfield");
        var secondInFirstCity = tripAttraction(
                2L, "2", TripAttractionGroup.PRIMARY, 1, "Springfield");
        var firstInSecondCity = tripAttraction(
                3L, "1", TripAttractionGroup.PRIMARY, 2, "Springfield");
        var secondInSecondCity = tripAttraction(
                4L, "2", TripAttractionGroup.PRIMARY, 2, "Springfield");

        var changes = TripBoard.arrange(
                List.of(firstInFirstCity, firstInSecondCity,
                        secondInFirstCity, secondInSecondCity),
                List.of(
                        new TripBoardItem(1L, TripAttractionGroup.PRIMARY),
                        new TripBoardItem(2L, TripAttractionGroup.PRIMARY),
                        new TripBoardItem(3L, TripAttractionGroup.PRIMARY),
                        new TripBoardItem(4L, TripAttractionGroup.PRIMARY)));

        assertThat(changes).isEmpty();
    }

    @Test
    void arrangingBoardShouldRejectDuplicateAttractionIds() {
        var first = tripAttraction(1L, "1", TripAttractionGroup.PRIMARY, "City");
        var second = tripAttraction(2L, "2", TripAttractionGroup.PRIMARY, "City");

        var exception = assertThrows(BaseApiException.class, () ->
                TripBoard.arrange(List.of(first, second), List.of(
                        new TripBoardItem(1L, TripAttractionGroup.PRIMARY),
                        new TripBoardItem(1L, TripAttractionGroup.PRIMARY))));

        assertThat(exception.getErrorCode()).isEqualTo(BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
    }

    @Test
    void arrangingBoardShouldRejectIncompleteRequest() {
        var first = tripAttraction(1L, "1", TripAttractionGroup.PRIMARY, "City");
        var second = tripAttraction(2L, "2", TripAttractionGroup.PRIMARY, "City");

        var exception = assertThrows(BaseApiException.class, () ->
                TripBoard.arrange(List.of(first, second), List.of(
                        new TripBoardItem(1L, TripAttractionGroup.PRIMARY))));

        assertThat(exception.getErrorCode()).isEqualTo(BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
    }

    @Test
    void arrangingBoardShouldRejectAttractionNotUnderTrip() {
        var first = tripAttraction(1L, "1", TripAttractionGroup.PRIMARY, "City");

        var exception = assertThrows(BaseApiException.class, () ->
                TripBoard.arrange(List.of(first), List.of(
                        new TripBoardItem(99L, TripAttractionGroup.PRIMARY))));

        assertThat(exception.getErrorCode()).isEqualTo(BaseApiException.ErrorCode.OBJECT_NOT_FOUND);
    }

    @Test
    void movingAttractionShouldRejectMovedAttractionAsNeighbor() {
        var moved = tripAttraction(1L, "1", TripAttractionGroup.PRIMARY, "City");
        var next = tripAttraction(2L, "2", TripAttractionGroup.PRIMARY, "City");

        var exception = assertThrows(BaseApiException.class, () ->
                TripBoard.moveAttraction(
                        moved, TripAttractionGroup.PRIMARY, moved, next));

        assertThat(exception.getErrorCode()).isEqualTo(BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        assertThat(moved.getBoardPosition()).isEqualByComparingTo("1");
    }

    @Test
    void movingAttractionShouldRejectSamePreviousAndNextNeighbor() {
        var moved = tripAttraction(1L, "1", TripAttractionGroup.PRIMARY, "City");
        var neighbor = tripAttraction(2L, "2", TripAttractionGroup.PRIMARY, "City");

        var exception = assertThrows(BaseApiException.class, () ->
                TripBoard.moveAttraction(
                        moved, TripAttractionGroup.PRIMARY, neighbor, neighbor));

        assertThat(exception.getErrorCode()).isEqualTo(BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        assertThat(moved.getBoardPosition()).isEqualByComparingTo("1");
    }

    @Test
    void movingAttractionShouldRejectNeighborOutsideTargetColumn() {
        var moved = tripAttraction(
                1L, "1", TripAttractionGroup.PRIMARY, 1, "First city");
        var otherCityNeighbor = tripAttraction(
                2L, "2", TripAttractionGroup.PRIMARY, 2, "Second city");

        var exception = assertThrows(BaseApiException.class, () ->
                TripBoard.moveAttraction(
                        moved, TripAttractionGroup.PRIMARY, null, otherCityNeighbor));

        assertThat(exception.getErrorCode()).isEqualTo(BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        assertThat(moved.getBoardPosition()).isEqualByComparingTo("1");
    }

    @Test
    void movingAttractionShouldRejectNeighborsInReverseOrder() {
        var moved = tripAttraction(1L, "3", TripAttractionGroup.PRIMARY, "City");
        var previous = tripAttraction(2L, "2", TripAttractionGroup.PRIMARY, "City");
        var next = tripAttraction(3L, "1", TripAttractionGroup.PRIMARY, "City");

        var exception = assertThrows(BaseApiException.class, () ->
                TripBoard.moveAttraction(
                        moved, TripAttractionGroup.PRIMARY, previous, next));

        assertThat(exception.getErrorCode()).isEqualTo(BaseApiException.ErrorCode.CONSTRAINT_VIOLATION);
        assertThat(moved.getBoardPosition()).isEqualByComparingTo("3");
    }

    @Test
    void movingAttractionBetweenTargetGroupNeighborsShouldUpdateGroupAndPosition() {
        var moved = tripAttraction(1L, "4", TripAttractionGroup.PRIMARY, "City");
        var previous = tripAttraction(2L, "1", TripAttractionGroup.SECONDARY, "City");
        var next = tripAttraction(3L, "2", TripAttractionGroup.SECONDARY, "City");

        TripBoard.moveAttraction(
                moved, TripAttractionGroup.SECONDARY, previous, next);

        assertThat(moved.getAttractionGroup()).isEqualTo(TripAttractionGroup.SECONDARY);
        assertThat(moved.getBoardPosition()).isEqualByComparingTo("1.5");
    }

    private static TripAttraction tripAttraction(Long attractionId,
                                                  String boardPosition,
                                                  TripAttractionGroup group,
                                                  String cityName) {
        return tripAttraction(attractionId, boardPosition, group, 1, cityName);
    }

    private static TripAttraction tripAttraction(Long attractionId,
                                                  String boardPosition,
                                                  TripAttractionGroup group,
                                                  int cityId,
                                                  String cityName) {
        var city = new City();
        city.setId(cityId);
        city.setName(cityName);
        var attraction = new Attraction();
        attraction.setId(attractionId);
        attraction.setCity(city);
        var tripAttraction = new TripAttraction();
        tripAttraction.setAttraction(attraction);
        tripAttraction.setAttractionGroup(group);
        tripAttraction.setBoardPosition(new BigDecimal(boardPosition));
        return tripAttraction;
    }
}