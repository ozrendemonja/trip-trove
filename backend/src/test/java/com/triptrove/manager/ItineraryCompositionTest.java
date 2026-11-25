package com.triptrove.manager;

import com.triptrove.manager.application.dto.ConfirmItineraryEntryRemovalRequest;
import com.triptrove.manager.application.dto.GetItineraryResponse;
import com.triptrove.manager.application.dto.MoveAttractionOnBoardRequest;
import com.triptrove.manager.application.dto.MoveItineraryEntryRequest;
import com.triptrove.manager.application.dto.ScheduleAttractionRequest;
import com.triptrove.manager.application.dto.TripAttractionGroupDTO;
import com.triptrove.manager.application.dto.UpdateAttractionGroupRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryFixedStartRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionMustVisitRequest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.json.JsonCompareMode;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
class ItineraryCompositionTest extends AbstractIntegrationTest {
    private static final String ITINERARY = "/trips/1/itinerary";
    private static final LocalDate TODAY = LocalDate.parse("2027-03-29");
    private static final LocalDate TOMORROW = LocalDate.parse("2027-03-30");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper mapper;

    @Test
    void movingToTheBeginningPreservesTheFirstVisitsClockAndTheMovedVisitIdentity() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");

        move(garden, TODAY, market).andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost" + ITINERARY))
                .andExpect(content().string(""));

        saved().andExpect(jsonPath("$.days[0].entries[*].entryId", contains(garden.intValue(), market.intValue())))
                .andExpect(jsonPath("$.days[0].entries[*].timing.start",
                        contains("2027-03-29T07:30+02:00", "2027-03-29T09:00+02:00")))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(false))
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(3, 4, 5)));
    }

    @Test
    void aMoveToTheCurrentPositionPreservesTheGapAndTheCheck() throws Exception {
        seedTrip();
        schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");
        checkItinerary();
        var checked = saved().andReturn().getResponse().getContentAsString();

        move(garden, TODAY, null).andExpect(status().isNoContent());

        saved().andExpect(content().json(checked, JsonCompareMode.STRICT));
    }

    @Test
    void movingAcrossDaysConsumesOnlyTheNecessaryGapAndGroupsRepeatedMoves() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        schedule(2L, TODAY, "13:00");
        var garden = schedule(3L, TOMORROW, "10:00");
        var gallery = schedule(4L, TOMORROW, "12:00");
        schedule(5L, TOMORROW, "16:00");
        checkItinerary();

        move(market, TOMORROW, gallery).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].timing.start", contains("2027-03-29T13:00+02:00")))
                .andExpect(jsonPath("$.days[1].entries[*].timing.start", contains("2027-03-30T10:00+02:00",
                        "2027-03-30T11:30+02:00", "2027-03-30T13:00+02:00", "2027-03-30T16:00+02:00")));

        move(market, TOMORROW, garden).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[1].entries[0].entryId").value(market))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value("2027-03-30T08:30+02:00"))
                .andExpect(jsonPath("$.days[1].entries[2].entryId").value(gallery))
                .andExpect(jsonPath("$.days[1].entries[2].timing.start").value("2027-03-30T13:00+02:00"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].entryId").value(market))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("ENTRY_MOVED", "FOLLOWING_STARTS_PUSHED")));
    }

    @Test
    void emptyDestinationOffersBothRepeatedStartsWithoutWritingUntilOneIsChosen() throws Exception {
        var beforeClockChange = LocalDate.parse("2027-10-30");
        var clockChange = LocalDate.parse("2027-10-31");
        seedTrip(beforeClockChange, clockChange);
        var market = schedule(1L, beforeClockChange, "02:00");
        var beforeMove = saved().andReturn().getResponse().getContentAsString();

        move(market, clockChange, null).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("This start clock occurs twice. Choose which occurrence to use."))
                .andExpect(jsonPath("$.moveStartChoices.offsets", contains("+02:00", "+01:00")));
        saved().andExpect(content().json(beforeMove, JsonCompareMode.STRICT));

        move(market, new MoveItineraryEntryRequest(clockChange, null, "+01:00"))
                .andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[1].entries[0].entryId").value(market))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value("2027-10-31T02:00+01:00"))
                .andExpect(jsonPath("$.days[1].entries[0].timing.end").value("2027-10-31T03:30+01:00"));
    }

    @Test
    void fixedEntryUsesTheOnlyRepeatedStartThatFitsTheChosenPosition() throws Exception {
        var beforeClockChange = LocalDate.parse("2027-10-30");
        var clockChange = LocalDate.parse("2027-10-31");
        seedTrip(beforeClockChange, clockChange);
        var market = schedule(1L, beforeClockChange, "02:00");
        lock(market);
        var garden = schedule(2L, clockChange, "00:45");
        lock(garden);

        move(market, clockChange, null).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[1].entries[1].entryId").value(market))
                .andExpect(jsonPath("$.days[1].entries[1].fixedStart").value(true))
                .andExpect(jsonPath("$.days[1].entries[1].timing.start").value("2027-10-31T02:00+01:00"));
    }

    @Test
    void poolGapAtTheSecondOccurrenceUsesTheSuggestedInstantWithoutMovingTheSavedEntry() throws Exception {
        var clockChange = LocalDate.parse("2027-10-31");
        seedTrip(clockChange, clockChange);
        var market = schedule(1L, clockChange, "01:45");
        var request = new ScheduleAttractionRequest(2L, clockChange, "02:15", null, null, "+01:00");

        mockMvc.perform(post(ITINERARY + "/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        saved().andExpect(jsonPath("$.days[0].entries[0].entryId").value(market))
                .andExpect(jsonPath("$.days[0].entries[*].timing.start",
                        contains("2027-10-31T01:45+02:00", "2027-10-31T02:15+01:00")))
                .andExpect(jsonPath("$.days[0].entries[1].timing.repeatedStart").value(true));
    }

    @Test
    void fixedEntryKeepsItsClockOnAnEmptyDateAndIsRejectedInTheWrongPosition() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        schedule(2L, TODAY, "11:00");
        lock(market);

        move(market, TOMORROW, null).andExpect(status().isNoContent());
        var accepted = saved().andExpect(jsonPath("$.days[1].entries[0].entryId").value(market))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value("2027-03-30T09:00+02:00"))
                .andExpect(jsonPath("$.days[1].entries[0].timing.end").value("2027-03-30T10:30+02:00"))
                .andExpect(jsonPath("$.days[1].entries[0].fixedStart").value(true))
                .andReturn().getResponse().getContentAsString();

        move(market, TODAY, null).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "The move conflicts with Garden. Choose another position or day."));
        saved().andExpect(content().json(accepted, JsonCompareMode.STRICT));
    }

    @Test
    void moveCannotPushAFixedStartEvenAfterAnUnlockedEntryWouldMove() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        schedule(2L, TOMORROW, "09:00");
        var garden = schedule(3L, TOMORROW, "10:45");
        var gallery = schedule(4L, TOMORROW, "12:20");
        lock(gallery);
        var before = saved().andReturn().getResponse().getContentAsString();

        move(market, TOMORROW, garden).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "The move conflicts with the fixed start of Gallery. Choose another position or day."));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));
    }

    @Test
    void removingTheLastCheckedEntryReturnsItToThePoolAndKeepsAnUnlinkedSummary() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        checkItinerary();

        remove(market).andExpect(status().isNoContent());

        saved().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(1, 2, 3, 4, 5)))
                .andExpect(jsonPath("$.lastCheckedAt").exists())
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].entryId").doesNotExist())
                .andExpect(jsonPath("$.changeNotices[0].subject").value("Market"))
                .andExpect(jsonPath("$.changeNotices[0].date").value(TODAY.toString()))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("ENTRY_REMOVED")));

        checkItinerary();
        saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void removingAClosedEntryLeavesItOutOfThePoolAndDoesNotPullTheNextEntryEarlier() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");
        entityManager.createNativeQuery("UPDATE attraction SET permanently_closed_at = now() WHERE id = 1")
                .executeUpdate();

        remove(market).andExpect(status().isNoContent());

        saved().andExpect(jsonPath("$.days[0].entries[0].entryId").value(garden))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-03-29T13:00+02:00"))
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(3, 4, 5)));
    }

    @Test
    void removingAScheduledAttractionFromTheTripKeepsOneRemovalSummary() throws Exception {
        seedTrip();
        var market = schedule(1L, TOMORROW, "09:00");
        var garden = schedule(2L, TOMORROW, "13:00");
        checkItinerary();
        var confirmation = new ConfirmItineraryEntryRemovalRequest(market);

        mockMvc.perform(delete("/trips/1/attractions/1").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(confirmation)))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].attractionId", contains(2, 3, 4, 5)));
        saved().andExpect(jsonPath("$.days[1].entries[*].entryId", contains(garden.intValue())))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value("2027-03-30T13:00+02:00"))
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(3, 4, 5)))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].entryId").doesNotExist())
                .andExpect(jsonPath("$.changeNotices[0].subject").value("Market"))
                .andExpect(jsonPath("$.changeNotices[0].date").value(TOMORROW.toString()))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("ENTRY_REMOVED", "REMOVED_FROM_TRIP")));
    }

    @Test
    void boardExclusionWithPreMoveConfirmationRemovesTheVisitAndReinclusionRestoresOnlyThePoolEntry() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        checkItinerary();
        var confirmation = new ConfirmItineraryEntryRemovalRequest(market);
        move(market, TOMORROW, null).andExpect(status().isNoContent());

        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.EXCLUDED, null, null, confirmation))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.attractionId == 1)].attractionGroup", contains("EXCLUDED")));
        saved().andExpect(jsonPath("$.days[1].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 3, 4, 5)))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].date").value(TOMORROW.toString()))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("ENTRY_REMOVED", "ATTRACTION_EXCLUDED")));

        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.SECONDARY, null, null))
                .andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[*].entries[*]").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 3, 4, 5, 1)));
    }

    @Test
    void excludingWithAConfirmationOfAReplacedEntryRequiresANewConfirmation() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var oldConfirmation = new ConfirmItineraryEntryRemovalRequest(market);
        remove(market).andExpect(status().isNoContent());
        var rescheduledMarket = schedule(1L, TODAY, "09:00");
        var before = saved().andReturn().getResponse().getContentAsString();

        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.EXCLUDED, null, null, oldConfirmation))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The itinerary consequences changed. Review them and confirm the board change again."));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));

        var newConfirmation = new ConfirmItineraryEntryRemovalRequest(rescheduledMarket);
        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.EXCLUDED, null, null, newConfirmation))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.attractionId == 1)].attractionGroup", contains("EXCLUDED")));
        saved().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 3, 4, 5)));
    }

    @Test
    void confirmedGroupUpdateToExcludedBeforeTheFirstCheckRemovesTheVisitWithoutAPoolEntryOrChangeNotice() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var confirmation = new ConfirmItineraryEntryRemovalRequest(market);
        var request = new UpdateAttractionGroupRequest(TripAttractionGroupDTO.EXCLUDED, confirmation);

        mockMvc.perform(put("/trips/1/attractions/1/group").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.attractionId == 1)].attractionGroup", contains("EXCLUDED")));
        saved().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 3, 4, 5)))
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void movingBetweenEligibleColumnsAndChangingMustVisitKeepTheExistingEntryOrderAndInterval() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");
        lock(market);

        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.SECONDARY, null, null))
                .andExpect(status().isNoContent());
        mockMvc.perform(put("/trips/1/attractions/1/must-visit").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new UpdateTripAttractionMustVisitRequest(false))))
                .andExpect(status().isNoContent());

        saved().andExpect(jsonPath("$.days[0].entries[*].entryId", contains(market.intValue(), garden.intValue())))
                .andExpect(jsonPath("$.days[0].entries[0].attractionGroup").value("SECONDARY"))
                .andExpect(jsonPath("$.days[0].entries[0].mustVisit").value(false))
                .andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(true))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-03-29T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T10:30+02:00"));
    }

    private ResultActions moveOnBoard(MoveAttractionOnBoardRequest move) throws Exception {
        return mockMvc.perform(put("/trips/1/board/attractions/1").header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(move)));
    }

    private ResultActions remove(long entryId) throws Exception {
        return mockMvc.perform(delete(ITINERARY + "/entries/{entryId}", entryId).header("x-api-version", "1"));
    }

    private void checkItinerary() throws Exception {
        mockMvc.perform(post(ITINERARY + "/check").header("x-api-version", "1")).andExpect(status().isNoContent());
    }

    private void lock(long entryId) throws Exception {
        mockMvc.perform(put(ITINERARY + "/entries/{entryId}/fixed-start", entryId)
                .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(new UpdateItineraryEntryFixedStartRequest(true))))
                .andExpect(status().isNoContent());
    }

    private ResultActions move(long entryId, LocalDate date, Long beforeEntryId) throws Exception {
        return move(entryId, new MoveItineraryEntryRequest(date, beforeEntryId, null));
    }

    private ResultActions move(long entryId, MoveItineraryEntryRequest request) throws Exception {
        return mockMvc.perform(put(ITINERARY + "/entries/{entryId}/position", entryId)
                .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)));
    }

    private ResultActions saved() throws Exception {
        entityManager.flush();
        entityManager.clear();
        return mockMvc.perform(get(ITINERARY).header("x-api-version", "1")).andExpect(status().isOk());
    }

    private Long schedule(long attractionId, LocalDate date, String clock) throws Exception {
        var request = new ScheduleAttractionRequest(attractionId, date, clock, "Europe/Belgrade", null);
        mockMvc.perform(post(ITINERARY + "/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
        return mapper.readValue(saved().andReturn().getResponse().getContentAsString(), GetItineraryResponse.class)
                .days().stream().flatMap(day -> day.entries().stream())
                .filter(entry -> entry.attractionId() == attractionId)
                .findFirst().orElseThrow().entryId();
    }

    private void seedTrip() {
        seedTrip(TODAY, TOMORROW);
    }

    private void seedTrip(LocalDate first, LocalDate last) {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, 5);
        entityManager.createNativeQuery("""
                UPDATE trip SET trip_start_date = :first, trip_end_date = :last WHERE id = 1;
                UPDATE attraction SET name = names.label
                FROM (VALUES (1, 'Market'), (2, 'Garden'), (3, 'Park'), (4, 'Gallery'), (5, 'Lookout')) AS names(id, label)
                WHERE attraction.id = names.id;
                INSERT INTO itinerary(trip_id) VALUES (1);
                INSERT INTO itinerary_day(trip_id, date)
                SELECT 1, CAST(:first AS date) + day_offset
                FROM generate_series(0, CAST(:last AS date) - CAST(:first AS date)) AS days(day_offset);
                """).setParameter("first", first).setParameter("last", last).executeUpdate();
    }
}
