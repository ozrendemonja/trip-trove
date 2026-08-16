package com.triptrove.manager.domain.algorithm;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;
import java.util.stream.IntStream;

public final class FractionalIndexing {
    private static final BigDecimal INDEX_STEP = BigDecimal.ONE;

    private FractionalIndexing() {
    }

    public static BigDecimal indexAfter(BigDecimal index) {
        return (index == null ? BigDecimal.ZERO : index).add(INDEX_STEP);
    }

    public static BigDecimal indexBefore(BigDecimal index) {
        return index.subtract(INDEX_STEP);
    }

    public static BigDecimal indexBetween(BigDecimal lowerIndex, BigDecimal upperIndex) {
        return lowerIndex.add(upperIndex).divide(BigDecimal.valueOf(2));
    }

    public static <T> List<IndexUpdate<T>> calculateIndexUpdates(
            List<T> itemsInRequestedOrder,
            Function<T, Integer> currentOrderIndex,
            Function<T, BigDecimal> currentFractionalIndex) {
        var requestedOrderSnapshot = createRequestedOrderSnapshot(
                itemsInRequestedOrder, currentOrderIndex, currentFractionalIndex);
        var orderedSubsequence = findLongestOrderedSubsequence(requestedOrderSnapshot);
        var anchors = retainSubsequenceAsAnchors(orderedSubsequence);
        var proposedIndices = calculateIndicesForRemainingItems(requestedOrderSnapshot, anchors);
        return findRequiredUpdates(proposedIndices);
    }

    private static <T> List<RequestedItem<T>> createRequestedOrderSnapshot(
            List<T> itemsInRequestedOrder,
            Function<T, Integer> currentOrderIndex,
            Function<T, BigDecimal> currentFractionalIndex) {
        return IntStream.range(0, itemsInRequestedOrder.size())
            .mapToObj(requestedIndex -> {
                var item = itemsInRequestedOrder.get(requestedIndex);
                return new RequestedItem<>(
                    item,
                    requestedIndex,
                    currentOrderIndex.apply(item),
                    currentFractionalIndex.apply(item));
            })
            .toList();
    }

    private static <T> List<RequestedItem<T>> findLongestOrderedSubsequence(
            List<RequestedItem<T>> requestedOrder) {
        var existingItems = retainItemsWithCurrentOrder(requestedOrder);
        var subsequenceState = buildOrderedSubsequences(existingItems);
        return reconstructLongestSubsequence(existingItems, subsequenceState);
    }

    private static <T> List<RequestedItem<T>> retainItemsWithCurrentOrder(
            List<RequestedItem<T>> requestedOrder) {
        return requestedOrder.stream()
                .filter(RequestedItem::hasCurrentOrder)
                .toList();
    }

    private static <T> SubsequenceState buildOrderedSubsequences(
            List<RequestedItem<T>> existingItems) {
        var subsequenceState = new SubsequenceState(existingItems.size());
        for (int itemIndex = 0; itemIndex < existingItems.size(); itemIndex++) {
            subsequenceState = placeItemInOrderedSubsequence(
                    existingItems, itemIndex, subsequenceState);
        }
        return subsequenceState;
    }

    private static <T> SubsequenceState placeItemInOrderedSubsequence(
            List<RequestedItem<T>> existingItems,
            int itemIndex,
            SubsequenceState subsequenceState) {
        var insertionIndex = findSequenceInsertionIndexUsingBinarySearch(existingItems, itemIndex, subsequenceState);
        return subsequenceState.withItemPlacedAt(itemIndex, insertionIndex);
    }

    private static <T> int findSequenceInsertionIndexUsingBinarySearch(
            List<RequestedItem<T>> existingItems,
            int itemIndex,
            SubsequenceState subsequenceState) {
        int firstCandidate = 0;
        int afterLastCandidate = subsequenceState.sequenceLength();
        while (firstCandidate < afterLastCandidate) {
            int candidate = (firstCandidate + afterLastCandidate) >>> 1;
            var sequenceEnd = existingItems.get(
                    subsequenceState.sequenceEndItemIndexAt(candidate));
            var item = existingItems.get(itemIndex);
            if (sequenceEnd.currentOrderIndex() < item.currentOrderIndex()) {
                firstCandidate = candidate + 1;
            } else {
                afterLastCandidate = candidate;
            }
        }
        return firstCandidate;
    }

    private static <T> List<RequestedItem<T>> reconstructLongestSubsequence(
            List<RequestedItem<T>> existingItems,
            SubsequenceState subsequenceState) {
        if (subsequenceState.isEmpty()) {
            return List.of();
        }

        var orderedSubsequence = new ArrayList<RequestedItem<T>>();
        int itemIndex = subsequenceState.lastSequenceEndItemIndex();
        while (itemIndex >= 0) {
            orderedSubsequence.add(existingItems.get(itemIndex));
            itemIndex = subsequenceState.previousItemIndexOf(itemIndex);
        }
        Collections.reverse(orderedSubsequence);
        return orderedSubsequence;
    }

    private static <T> List<Anchor> retainSubsequenceAsAnchors(
            List<RequestedItem<T>> orderedSubsequence) {
        return orderedSubsequence.stream()
                .map(item -> new Anchor(item.requestedIndex()))
                .toList();
    }

    private static <T> List<ProposedIndex<T>> calculateIndicesForRemainingItems(
            List<RequestedItem<T>> requestedOrder,
            List<Anchor> anchors) {
        return findRangesWithoutAnchors(requestedOrder.size(), anchors).stream()
            .flatMap(range -> calculateIndicesForRange(requestedOrder, range).stream())
            .toList();
    }

    private static List<IndexRange> findRangesWithoutAnchors(
            int itemCount,
            List<Anchor> anchors) {
        var ranges = new ArrayList<IndexRange>();
        int rangeStart = 0;
        for (var anchor : anchors) {
            if (rangeStart < anchor.requestedIndex()) {
                ranges.add(new IndexRange(rangeStart, anchor.requestedIndex()));
            }
            rangeStart = anchor.requestedIndex() + 1;
        }
        if (rangeStart < itemCount) {
            ranges.add(new IndexRange(rangeStart, itemCount));
        }
        return ranges;
    }

    private static <T> List<ProposedIndex<T>> calculateIndicesForRange(
            List<RequestedItem<T>> requestedOrder,
            IndexRange itemsToReindex) {
        if (itemsToReindex.coversEntireOrder(requestedOrder.size())) {
            return calculateIndicesWithoutAnchors(requestedOrder, itemsToReindex);
        }
        if (itemsToReindex.startsAtBeginning()) {
            return calculateIndicesBeforeFirstAnchor(requestedOrder, itemsToReindex);
        }
        if (itemsToReindex.endsAt(requestedOrder.size())) {
            return calculateIndicesAfterLastAnchor(requestedOrder, itemsToReindex);
        }
        return calculateIndicesBetweenAnchors(requestedOrder, itemsToReindex);
    }

    private static <T> List<ProposedIndex<T>> calculateIndicesWithoutAnchors(
            List<RequestedItem<T>> requestedOrder,
            IndexRange range) {
        var proposedIndices = new ArrayList<ProposedIndex<T>>();
        BigDecimal fractionalIndex = null;
        for (int itemIndex = range.startInclusive(); itemIndex < range.endExclusive(); itemIndex++) {
            fractionalIndex = indexAfter(fractionalIndex);
            proposedIndices.add(new ProposedIndex<>(requestedOrder.get(itemIndex), fractionalIndex));
        }
        return proposedIndices;
    }

    private static <T> List<ProposedIndex<T>> calculateIndicesBeforeFirstAnchor(
            List<RequestedItem<T>> requestedOrder,
            IndexRange range) {
        var proposedIndices = new ArrayList<ProposedIndex<T>>();
        var fractionalIndex = requestedOrder.get(range.endExclusive()).currentFractionalIndex();
        for (int itemIndex = range.endExclusive() - 1;
             itemIndex >= range.startInclusive();
             itemIndex--) {
            fractionalIndex = indexBefore(fractionalIndex);
            proposedIndices.add(new ProposedIndex<>(requestedOrder.get(itemIndex), fractionalIndex));
        }
        Collections.reverse(proposedIndices);
        return proposedIndices;
    }

    private static <T> List<ProposedIndex<T>> calculateIndicesAfterLastAnchor(
            List<RequestedItem<T>> requestedOrder,
            IndexRange range) {
        var proposedIndices = new ArrayList<ProposedIndex<T>>();
        var fractionalIndex = requestedOrder.get(range.startInclusive() - 1).currentFractionalIndex();
        for (int itemIndex = range.startInclusive(); itemIndex < range.endExclusive(); itemIndex++) {
            fractionalIndex = indexAfter(fractionalIndex);
            proposedIndices.add(new ProposedIndex<>(requestedOrder.get(itemIndex), fractionalIndex));
        }
        return proposedIndices;
    }

    private static <T> List<ProposedIndex<T>> calculateIndicesBetweenAnchors(
            List<RequestedItem<T>> requestedOrder,
            IndexRange range) {
        var proposedIndices = new ArrayList<ProposedIndex<T>>();
        var fractionalIndex = requestedOrder.get(range.startInclusive() - 1).currentFractionalIndex();
        var nextAnchorIndex = requestedOrder.get(range.endExclusive()).currentFractionalIndex();
        for (int itemIndex = range.startInclusive(); itemIndex < range.endExclusive(); itemIndex++) {
            fractionalIndex = indexBetween(fractionalIndex, nextAnchorIndex);
            proposedIndices.add(new ProposedIndex<>(requestedOrder.get(itemIndex), fractionalIndex));
        }
        return proposedIndices;
    }

    private static <T> List<IndexUpdate<T>> findRequiredUpdates(
            List<ProposedIndex<T>> proposedIndices) {
        return proposedIndices.stream()
                .filter(ProposedIndex::changesCurrentIndex)
                .map(ProposedIndex::toIndexUpdate)
                .toList();
    }

    private record RequestedItem<T>(
            T item,
            int requestedIndex,
            Integer currentOrderIndex,
            BigDecimal currentFractionalIndex) {
        private boolean hasCurrentOrder() {
            return currentOrderIndex != null;
        }
    }

    private record Anchor(int requestedIndex) {
    }

    private record IndexRange(int startInclusive, int endExclusive) {
        private boolean coversEntireOrder(int itemCount) {
            return startsAtBeginning() && endsAt(itemCount);
        }

        private boolean startsAtBeginning() {
            return startInclusive == 0;
        }

        private boolean endsAt(int itemCount) {
            return endExclusive == itemCount;
        }
    }

    private record ProposedIndex<T>(RequestedItem<T> requestedItem, BigDecimal fractionalIndex) {
        private boolean changesCurrentIndex() {
            return requestedItem.currentFractionalIndex().compareTo(fractionalIndex) != 0;
        }

        private IndexUpdate<T> toIndexUpdate() {
            return new IndexUpdate<>(requestedItem.item(), fractionalIndex);
        }
    }

    private static final class SubsequenceState {
        private final int[] sequenceEndItemIndices;
        private final int[] previousItemIndices;
        private final int sequenceLength;

        private SubsequenceState(int itemCount) {
            sequenceEndItemIndices = new int[itemCount];
            previousItemIndices = new int[itemCount];
            Arrays.fill(previousItemIndices, -1);
            sequenceLength = 0;
        }

        private SubsequenceState(
                int[] sequenceEndItemIndices,
                int[] previousItemIndices,
                int sequenceLength) {
            this.sequenceEndItemIndices = sequenceEndItemIndices;
            this.previousItemIndices = previousItemIndices;
            this.sequenceLength = sequenceLength;
        }

        private SubsequenceState withItemPlacedAt(int itemIndex, int sequenceIndex) {
            var updatedSequenceEnds = sequenceEndItemIndices.clone();
            var updatedPredecessors = previousItemIndices.clone();
            if (sequenceIndex > 0) {
                updatedPredecessors[itemIndex] = sequenceEndItemIndices[sequenceIndex - 1];
            }
            updatedSequenceEnds[sequenceIndex] = itemIndex;
            var updatedSequenceLength = Math.max(sequenceLength, sequenceIndex + 1);
            return new SubsequenceState(
                    updatedSequenceEnds, updatedPredecessors, updatedSequenceLength);
        }

        private int sequenceLength() {
            return sequenceLength;
        }

        private int sequenceEndItemIndexAt(int sequenceIndex) {
            return sequenceEndItemIndices[sequenceIndex];
        }

        private int previousItemIndexOf(int itemIndex) {
            return previousItemIndices[itemIndex];
        }

        private int lastSequenceEndItemIndex() {
            return sequenceEndItemIndices[sequenceLength - 1];
        }

        private boolean isEmpty() {
            return sequenceLength == 0;
        }
    }

    public record IndexUpdate<T>(T item, BigDecimal index) {
    }
}