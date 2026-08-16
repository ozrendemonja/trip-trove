package com.triptrove.manager.domain.algorithm;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FractionalIndexingTest {
    @Test
    void shouldCalculateIndexBetweenAnchors() {
        var first = item(0, "1");
        var second = item(1, "2");
        var moved = item(2, "3");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(first, moved, second),
                Item::currentOrderIndex,
                Item::fractionalIndex);

        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(moved, new BigDecimal("1.5")));
    }

    @Test
    void shouldCalculateIndicesBeforeFirstAnchor() {
                var first = item(0, "1");
                var second = item(1, "2");
                var moved = item(2, "3");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(moved, first, second),
                Item::currentOrderIndex,
                Item::fractionalIndex);

        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(moved, new BigDecimal("0")));
    }

    @Test
    void shouldCalculateIndicesAfterLastAnchor() {
                var first = item(1, "2");
                var second = item(2, "3");
                var moved = item(0, "1");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(first, second, moved),
                Item::currentOrderIndex,
                Item::fractionalIndex);

        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(moved, new BigDecimal("4")));
    }

    @Test
    void shouldCalculateIndicesWithoutAnchors() {
        var first = item(null, "5");
        var second = item(null, "6");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(first, second),
                Item::currentOrderIndex,
                Item::fractionalIndex);

        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(first, new BigDecimal("1")),
                new FractionalIndexing.IndexUpdate<>(second, new BigDecimal("2")));
    }

    @Test
    void shouldReturnNoUpdatesForEmptyOrder() {
        var updates = FractionalIndexing.calculateIndexUpdates(
                List.<Item>of(),
                Item::currentOrderIndex,
                Item::fractionalIndex);

        assertThat(updates).isEmpty();
    }

    @Test
    void shouldReturnNoUpdatesWhenRequestedOrderIsUnchanged() {
        var first = item(0, "1");
        var second = item(1, "2");
        var third = item(2, "3");
        var fourth = item(3, "4");
        var fifth = item(4, "5");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(first, second, third, fourth, fifth),
                Item::currentOrderIndex,
                Item::fractionalIndex);

        assertThat(updates).isEmpty();
    }

    @Test
    void shouldCalculateIndexForSingleItemWithoutAnchors() {
        var onlyItem = item(null, "100");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(onlyItem),
                Item::currentOrderIndex,
                Item::fractionalIndex);

        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(onlyItem, new BigDecimal("1")));
    }

    @Test
    void shouldCalculateIndicesForMultipleItemsBetweenAnchors() {
        var firstAnchor = item(0, "1");
        var firstNewItem = item(null, "10");
        var secondNewItem = item(null, "20");
        var secondAnchor = item(1, "2");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(firstAnchor, firstNewItem, secondNewItem, secondAnchor),
                Item::currentOrderIndex,
                Item::fractionalIndex);

        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(firstNewItem, new BigDecimal("1.5")),
                new FractionalIndexing.IndexUpdate<>(secondNewItem, new BigDecimal("1.75")));
    }

    @Test
    void shouldPreserveOrderWhenItemsAreRepeatedlyMovedBetweenFirstTwoItems() {
        var first = item(0, "1");
        var second = item(1, "2");
        var third = item(2, "3");
        var fourth = item(3, "4");
        var fifth = item(4, "5");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(first, fifth, second, third, fourth),
                Item::currentOrderIndex,
                Item::fractionalIndex);
        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(fifth, new BigDecimal("1.5")));

        first = item(0, "1");
        fifth = item(1, "1.5");
        second = item(2, "2");
        third = item(3, "3");
        fourth = item(4, "4");

        updates = FractionalIndexing.calculateIndexUpdates(
                List.of(first, fourth, fifth, second, third),
                Item::currentOrderIndex,
                Item::fractionalIndex);
        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(fourth, new BigDecimal("1.25")));

        first = item(0, "1");
        fourth = item(1, "1.25");
        fifth = item(2, "1.5");
        second = item(3, "2");
        third = item(4, "3");

        updates = FractionalIndexing.calculateIndexUpdates(
                List.of(first, third, fourth, fifth, second),
                Item::currentOrderIndex,
                Item::fractionalIndex);
        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(third, new BigDecimal("1.125")));
    }

    @Test
    void shouldPreserveOrderWhenItemsAreRepeatedlyMovedToFirstPlace() {
        var first = item(0, "1");
        var second = item(1, "2");
        var third = item(2, "3");
        var fourth = item(3, "4");
        var fifth = item(4, "5");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(fifth, first, second, third, fourth),
                Item::currentOrderIndex,
                Item::fractionalIndex);
        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(fifth, new BigDecimal("0")));

        fifth = item(0, "0");
        first = item(1, "1");
        second = item(2, "2");
        third = item(3, "3");
        fourth = item(4, "4");

        updates = FractionalIndexing.calculateIndexUpdates(
                List.of(fourth, fifth, first, second, third),
                Item::currentOrderIndex,
                Item::fractionalIndex);
        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(fourth, new BigDecimal("-1")));

        fourth = item(0, "-1");
        fifth = item(1, "0");
        first = item(2, "1");
        second = item(3, "2");
        third = item(4, "3");

        updates = FractionalIndexing.calculateIndexUpdates(
                List.of(third, fourth, fifth, first, second),
                Item::currentOrderIndex,
                Item::fractionalIndex);
        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(third, new BigDecimal("-2")));

        third = item(0, "-2");
        fourth = item(1, "-1");
        fifth = item(2, "0");
        first = item(3, "1");
        second = item(4, "2");

        updates = FractionalIndexing.calculateIndexUpdates(
                List.of(second, third, fourth, fifth, first),
                Item::currentOrderIndex,
                Item::fractionalIndex);
        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(second, new BigDecimal("-3")));
    }

    @Test
    void shouldPreserveOrderWhenSecondIsMovedBetweenThirdAndFourth() {
        var third = item(0, "-2");
        var fourth = item(1, "-1");
        var fifth = item(2, "0");
        var first = item(3, "1");
        var second = item(4, "2");

        var updates = FractionalIndexing.calculateIndexUpdates(
                List.of(third, second, fourth, fifth, first),
                Item::currentOrderIndex,
                Item::fractionalIndex);

        assertThat(updates).containsExactly(
                new FractionalIndexing.IndexUpdate<>(second, new BigDecimal("-1.5")));
    }

    @Test
    void shouldCalculateIndicesRelativeToExistingIndex() {
        assertThat(FractionalIndexing.indexBefore(new BigDecimal("10")))
                .isEqualByComparingTo("9");
        assertThat(FractionalIndexing.indexAfter(new BigDecimal("10")))
                .isEqualByComparingTo("11");
        assertThat(FractionalIndexing.indexBetween(new BigDecimal("10"), new BigDecimal("20")))
                .isEqualByComparingTo("15");
    }

    private static Item item(Integer currentOrderIndex, String fractionalIndex) {
        return new Item(currentOrderIndex, new BigDecimal(fractionalIndex));
    }

    private record Item(Integer currentOrderIndex, BigDecimal fractionalIndex) {
    }
}