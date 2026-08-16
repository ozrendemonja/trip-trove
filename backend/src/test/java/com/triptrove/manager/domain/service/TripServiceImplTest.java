package com.triptrove.manager.domain.service;

import com.triptrove.manager.domain.model.Attraction;
import com.triptrove.manager.domain.model.BaseApiException;
import com.triptrove.manager.domain.model.Region;
import com.triptrove.manager.domain.model.TripAttraction;
import com.triptrove.manager.domain.model.TripAttractionGroup;
import com.triptrove.manager.domain.model.TripBoardItem;
import com.triptrove.manager.domain.repo.AttractionRepo;
import com.triptrove.manager.domain.repo.TripAttractionRepo;
import com.triptrove.manager.domain.repo.TripRepo;
import com.triptrove.manager.infra.ManagerProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TripServiceImplTest {
    @Mock
    private ManagerProperties managerProperties;
    @Mock
    private TripRepo tripRepo;
    @Mock
    private AttractionRepo attractionRepo;
    @Mock
    private TripAttractionRepo tripAttractionRepo;

    private TripServiceImpl tripService;

    @BeforeEach
    void setUp() {
        tripService = new TripServiceImpl(managerProperties, tripRepo, attractionRepo, tripAttractionRepo);
    }

    @Test
    void movingAttractionShouldSaveOnlyMovedAttraction() {
        var previous = tripAttraction(1L, "1");
        var moved = tripAttraction(2L, "4");
        var next = tripAttraction(3L, "2");
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 2L)).thenReturn(Optional.of(moved));
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 1L)).thenReturn(Optional.of(previous));
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 3L)).thenReturn(Optional.of(next));

        tripService.moveAttractionOnBoard(
                10L, 2L, TripAttractionGroup.PRIMARY, 1L, 3L);

        assertThat(moved.getBoardPosition()).isEqualByComparingTo("1.5");
        assertThat(previous.getBoardPosition()).isEqualByComparingTo("1");
        assertThat(next.getBoardPosition()).isEqualByComparingTo("2");
        verify(tripAttractionRepo).save(moved);
        verify(tripAttractionRepo, never()).save(previous);
        verify(tripAttractionRepo, never()).save(next);
        verify(tripAttractionRepo, never()).saveAll(anyList());
        verify(tripRepo, never()).recomputeArchived(10L);
    }

    @Test
    void movingAttractionToBeginningShouldAllowMissingPreviousNeighbor() {
        var moved = tripAttraction(2L, "4");
        var next = tripAttraction(3L, "2");
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 2L)).thenReturn(Optional.of(moved));
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 3L)).thenReturn(Optional.of(next));

        tripService.moveAttractionOnBoard(
                10L, 2L, TripAttractionGroup.PRIMARY, null, 3L);

        assertThat(moved.getBoardPosition()).isEqualByComparingTo("1");
        verify(tripAttractionRepo).save(moved);
        verify(tripAttractionRepo, never()).findByTripIdAndAttractionId(10L, null);
    }

    @Test
    void movingAttractionToEndShouldAllowMissingNextNeighbor() {
        var previous = tripAttraction(1L, "2");
        var moved = tripAttraction(2L, "1");
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 2L)).thenReturn(Optional.of(moved));
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 1L)).thenReturn(Optional.of(previous));

        tripService.moveAttractionOnBoard(
                10L, 2L, TripAttractionGroup.PRIMARY, 1L, null);

        assertThat(moved.getBoardPosition()).isEqualByComparingTo("3");
        verify(tripAttractionRepo).save(moved);
        verify(tripAttractionRepo, never()).findByTripIdAndAttractionId(10L, null);
    }

    @Test
    void movingAttractionToEmptyGroupShouldAllowBothNeighborsToBeMissing() {
        var moved = tripAttraction(2L, "4");
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 2L)).thenReturn(Optional.of(moved));

        tripService.moveAttractionOnBoard(
                10L, 2L, TripAttractionGroup.SECONDARY, null, null);

        assertThat(moved.getAttractionGroup()).isEqualTo(TripAttractionGroup.SECONDARY);
        assertThat(moved.getBoardPosition()).isEqualByComparingTo("4");
        verify(tripAttractionRepo).save(moved);
        verify(tripAttractionRepo, never()).findByTripIdAndAttractionId(10L, null);
        verify(tripRepo).recomputeArchived(10L);
    }

    @Test
    void movingAttractionShouldFailWhenNeighborIsNotUnderTrip() {
        var moved = tripAttraction(2L, "4");
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 2L)).thenReturn(Optional.of(moved));
        when(tripAttractionRepo.findByTripIdAndAttractionId(10L, 99L)).thenReturn(Optional.empty());

        var exception = assertThrows(BaseApiException.class, () ->
                tripService.moveAttractionOnBoard(
                        10L, 2L, TripAttractionGroup.PRIMARY, null, 99L));

        assertThat(exception.getErrorCode()).isEqualTo(BaseApiException.ErrorCode.OBJECT_NOT_FOUND);
        verify(tripAttractionRepo, never()).save(moved);
    }

    @Test
    void arrangingBoardShouldSaveOnlyMovedAttraction() {
        var first = tripAttraction(1L, "1");
        var second = tripAttraction(2L, "2");
        var moved = tripAttraction(3L, "3");
        when(tripRepo.existsById(10L)).thenReturn(true);
        when(tripAttractionRepo.findBoardAttractionsByTripId(10L))
                .thenReturn(List.of(first, second, moved));

        tripService.arrangeTripBoard(10L, List.of(
            new TripBoardItem(1L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(3L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(2L, TripAttractionGroup.PRIMARY)
        ));

        assertThat(first.getBoardPosition()).isEqualByComparingTo("1");
        assertThat(moved.getBoardPosition()).isEqualByComparingTo("1.5");
        assertThat(second.getBoardPosition()).isEqualByComparingTo("2");
        verify(tripAttractionRepo).saveAll(List.of(moved));
        verify(tripAttractionRepo, never()).save(first);
        verify(tripAttractionRepo, never()).save(second);
        verify(tripAttractionRepo, never()).save(moved);
        verify(tripRepo, never()).recomputeArchived(10L);
    }

    @Test
    void arrangingBoardShouldRecomputeArchivedWhenGroupChanges() {
        var first = tripAttraction(1L, "1");
        var second = tripAttraction(2L, "2");
        when(tripRepo.existsById(10L)).thenReturn(true);
        when(tripAttractionRepo.findBoardAttractionsByTripId(10L))
                .thenReturn(List.of(first, second));

        tripService.arrangeTripBoard(10L, List.of(
            new TripBoardItem(1L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(2L, TripAttractionGroup.EXCLUDED)
        ));

        assertThat(second.getAttractionGroup()).isEqualTo(TripAttractionGroup.EXCLUDED);
        verify(tripAttractionRepo).saveAll(List.of(second));
        verify(tripRepo).recomputeArchived(10L);
    }

    @Test
    void arrangingBoardShouldNotChangeAnotherDestination() {
        var first = tripAttraction(1L, "1", 1);
        var second = tripAttraction(2L, "2", 1);
        var moved = tripAttraction(3L, "3", 1);
        var otherRegion = tripAttraction(4L, "1", 2);
        when(tripRepo.existsById(10L)).thenReturn(true);
        when(tripAttractionRepo.findBoardAttractionsByTripId(10L))
                .thenReturn(List.of(first, otherRegion, second, moved));

        tripService.arrangeTripBoard(10L, List.of(
            new TripBoardItem(1L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(3L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(2L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(4L, TripAttractionGroup.PRIMARY)
        ));

        assertThat(moved.getBoardPosition()).isEqualByComparingTo("1.5");
        assertThat(otherRegion.getBoardPosition()).isEqualByComparingTo("1");
        verify(tripAttractionRepo).saveAll(List.of(moved));
    }

    @Test
    void arrangingBoardShouldPreserveRequestedOrder() {
        var first = tripAttraction(1L, "1");
        var second = tripAttraction(2L, "2");
        var third = tripAttraction(3L, "3");
        var fourth = tripAttraction(4L, "4");
        var fifth = tripAttraction(5L, "5");
        var sixth = tripAttraction(6L, "6");
        var seventh = tripAttraction(7L, "7");
        when(tripRepo.existsById(10L)).thenReturn(true);
        when(tripAttractionRepo.findBoardAttractionsByTripId(10L))
                .thenReturn(List.of(first, second, third, fourth, fifth, sixth, seventh));

        tripService.arrangeTripBoard(10L, List.of(
            new TripBoardItem(7L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(2L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(6L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(5L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(3L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(4L, TripAttractionGroup.PRIMARY),
            new TripBoardItem(1L, TripAttractionGroup.PRIMARY)
        ));

        assertThat(seventh.getBoardPosition()).isLessThan(second.getBoardPosition());
        assertThat(second.getBoardPosition()).isLessThan(sixth.getBoardPosition());
        assertThat(sixth.getBoardPosition()).isLessThan(fifth.getBoardPosition());
        assertThat(fifth.getBoardPosition()).isLessThan(third.getBoardPosition());
        assertThat(third.getBoardPosition()).isLessThan(fourth.getBoardPosition());
        assertThat(fourth.getBoardPosition()).isLessThan(first.getBoardPosition());
    }

    private static TripAttraction tripAttraction(Long attractionId, String boardPosition) {
        return tripAttraction(attractionId, boardPosition, 1);
    }

    private static TripAttraction tripAttraction(Long attractionId, String boardPosition, int regionId) {
        var attraction = new Attraction();
        attraction.setId(attractionId);
        var region = new Region();
        region.setId(regionId);
        region.setName("Region " + regionId);
        attraction.setRegion(region);
        var tripAttraction = new TripAttraction();
        tripAttraction.setAttraction(attraction);
        tripAttraction.setAttractionGroup(TripAttractionGroup.PRIMARY);
        tripAttraction.setBoardPosition(new BigDecimal(boardPosition));
        return tripAttraction;
    }
}