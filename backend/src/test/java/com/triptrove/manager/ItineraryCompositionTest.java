package com.triptrove.manager;

import com.jayway.jsonpath.JsonPath;
import com.triptrove.manager.application.dto.AttractionCategoryDTO;
import com.triptrove.manager.application.dto.AttractionTypeDTO;
import com.triptrove.manager.application.dto.CheckItineraryRequest;
import com.triptrove.manager.application.dto.ConfirmItineraryEntryRemovalRequest;
import com.triptrove.manager.application.dto.DateSpanDTO;
import com.triptrove.manager.application.dto.GetItineraryResponse;
import com.triptrove.manager.application.dto.GetItineraryResponse.ChangeNotice.SourceChange;
import com.triptrove.manager.application.dto.LocationDTO;
import com.triptrove.manager.application.dto.MoveAttractionOnBoardRequest;
import com.triptrove.manager.application.dto.MoveItineraryEntryRequest;
import com.triptrove.manager.application.dto.ScheduleAttractionRequest;
import com.triptrove.manager.application.dto.TripAttractionGroupDTO;
import com.triptrove.manager.application.dto.UpdateAttractionCategoryRequest;
import com.triptrove.manager.application.dto.UpdateAttractionDestinationRequest;
import com.triptrove.manager.application.dto.UpdateAttractionDetailRequest;
import com.triptrove.manager.application.dto.UpdateAttractionGroupRequest;
import com.triptrove.manager.application.dto.UpdateAttractionInformationProviderRequest;
import com.triptrove.manager.application.dto.UpdateAttractionLocationRequest;
import com.triptrove.manager.application.dto.UpdateAttractionPermanentlyClosedRequest;
import com.triptrove.manager.application.dto.UpdateAttractionTipRequest;
import com.triptrove.manager.application.dto.UpdateAttractionTraditionalRequest;
import com.triptrove.manager.application.dto.UpdateAttractionTypeRequest;
import com.triptrove.manager.application.dto.UpdateAttractionVisitPeriodRequest;
import com.triptrove.manager.application.dto.UpdateAttractionVisitRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryFixedStartRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryPlannedLengthRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryStartRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionMustVisitRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionNoteRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionVisitTimeRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionWorkingHoursRequest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.json.JsonCompareMode;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.LocalDate;

import static com.triptrove.manager.domain.model.WatchedSourceChangeSummary.Field.*;
import static org.assertj.core.api.Assertions.assertThat;
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
        assertSourceChanges(new SourceChange(IMPORTANCE, "MUST_SEE", "FIT_IN_NEARBY", false));

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
        assertSourceChanges(new SourceChange(MUST_VISIT, "YES", "NO", false),
                new SourceChange(IMPORTANCE, "MUST_SEE", "IF_PASSING_BY", false));
    }

    @Test
    void editingVisitDurationUpdatesTheItineraryWithoutReschedulingTheEntry() throws Exception {
        seedTrip(TODAY, TODAY, 1);
        var entryId = schedule(1L, TODAY, "09:00");
        saved().andExpect(jsonPath("$.days[0].entries[0].visitDuration").value("1h 30m"));

        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest("2h"));

        saved().andExpect(jsonPath("$.days[0].entries[0].entryId").value(entryId.intValue()))
                .andExpect(jsonPath("$.days[0].entries[0].visitDuration").value("2h"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-03-29T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T10:30+02:00"));
    }

    @Test
    void restoringWorkingHoursWhileTheItineraryIsClosedStillLeavesASourceNotice() throws Exception {
        seedTrip(TODAY, TODAY, 1);
        var workingHours = "/trips/1/attractions/1/working-hours";
        putFact(workingHours, new UpdateTripAttractionWorkingHoursRequest("09:00-17:00"));
        var market = schedule(1L, TODAY, "09:00");
        saved().andExpect(jsonPath("$.changeNotices").isEmpty());

        putFact(workingHours, new UpdateTripAttractionWorkingHoursRequest("10:00-18:00"));
        entityManager.flush();
        entityManager.clear();
        putFact(workingHours, new UpdateTripAttractionWorkingHoursRequest("09:00-17:00"));

        saved().andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].entryId").value(market))
                .andExpect(jsonPath("$.changeNotices[0].sourceBaseline").value("WHEN_SCHEDULED"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].field").value("WORKING_HOURS"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].baseline").value("09:00-17:00"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].current").value("09:00-17:00"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].restored").value(true));
    }

    @Test
    void aCheckCanOnlyAcknowledgeTheSourcesThatWereDisplayedForIt() throws Exception {
        seedTrip(TODAY, TOMORROW, 1);
        var workingHours = "/trips/1/attractions/1/working-hours";
        putFact(workingHours, new UpdateTripAttractionWorkingHoursRequest("09:00-17:00"));
        var market = schedule(1L, TODAY, "09:00");
        var firstDisplay = readCheckRequest();

        putFact(workingHours, new UpdateTripAttractionWorkingHoursRequest("10:00-18:00"));
        submitCheck(firstDisplay).andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("ITINERARY_CHECK_STALE"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "The itinerary or its attraction sources changed. Refresh and review the itinerary before checking again."));
        saved().andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].baseline").value("09:00-17:00"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].current").value("10:00-18:00"));

        var confirmedDisplay = readCheckRequest();
        submitCheck(confirmedDisplay).andExpect(status().isNoContent());
        var checked = saved().andExpect(jsonPath("$.changeNotices").isEmpty())
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andReturn().getResponse().getContentAsString();
        String checkedAt = JsonPath.read(checked, "$.lastCheckedAt");

        putFact(workingHours, new UpdateTripAttractionWorkingHoursRequest("11:00-19:00"));
        move(market, TOMORROW, null).andExpect(status().isNoContent());
        var reopened = saved().andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.lastCheckedAt").value(checkedAt))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("ENTRY_MOVED")))
                .andExpect(jsonPath("$.changeNotices[0].sourceBaseline").value("AT_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].baseline").value("10:00-18:00"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].current").value("11:00-19:00"))
                .andReturn().getResponse().getContentAsString();

        submitCheck(confirmedDisplay).andExpect(status().isConflict());
        saved().andExpect(content().json(reopened, JsonCompareMode.STRICT));
    }

    @Test
    void catalogueEditsGroupAllWatchedFieldsWithoutRetimingTheEntry() throws Exception {
        seedTrip(TODAY, TODAY, 2);
        var market = schedule(1L, TODAY, "09:00");

        putFact("/attractions/1/location", new UpdateAttractionLocationRequest("Market Street", new LocationDTO(41.5, 12.5)));
        putFact("/attractions/1/destination", new UpdateAttractionDestinationRequest(true, 2, null));
        putFact("/attractions/1/detail", new UpdateAttractionDetailRequest("Market", null));
        putFact("/attractions/1/category", new UpdateAttractionCategoryRequest(AttractionCategoryDTO.PARK));
        putFact("/attractions/1/type", new UpdateAttractionTypeRequest(AttractionTypeDTO.POTENTIAL_CHANGE));
        putFact("/attractions/1/tip", new UpdateAttractionTipRequest("Use the courtyard"));
        putFact("/attractions/1/visitPeriod", new UpdateAttractionVisitPeriodRequest(
                new DateSpanDTO(LocalDate.parse("2026-05-01"), LocalDate.parse("2026-09-01"))));
        putFact("/attractions/1/permanently-closed", new UpdateAttractionPermanentlyClosedRequest(true));

        saved().andExpect(jsonPath("$.days[0].entries[0].entryId").value(market))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-03-29T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T10:30+02:00"));
        assertSourceChanges(
                new SourceChange(ADDRESS, "Planning address", "Market Street", false),
                new SourceChange(LOCATION, null, "41.5, 12.5", false),
                new SourceChange(GEOGRAPHY, "Keyset city 1, Keyset region 1, Keyset country 1", "Keyset country 2 (countrywide)", false),
                new SourceChange(MAIN_ATTRACTION, "Park", null, false),
                new SourceChange(CATEGORY, "HISTORIC_SITE", "PARK", false),
                new SourceChange(TYPE, "STABLE", "POTENTIAL_CHANGE", false),
                new SourceChange(CATALOGUE_TIP, "Catalogue tip", "Use the courtyard", false),
                new SourceChange(OPTIMAL_VISIT_PERIOD, "2026-04-01/2026-10-01", "2026-05-01/2026-09-01", false),
                new SourceChange(PERMANENT_CLOSURE, "NOT_PERMANENTLY_CLOSED", "PERMANENTLY_CLOSED", false));
    }

    @Test
    void closingAndReopeningAnAttractionWarnsWithoutRemovingItsEntry() throws Exception {
        seedTrip(TODAY, TOMORROW, 1);
        var market = schedule(1L, TODAY, "09:00");
        checkItinerary();

        var closure = "/attractions/1/permanently-closed";
        putFact(closure, new UpdateAttractionPermanentlyClosedRequest(true));

        saved().andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.days[0].entries[0].entryId").value(market))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T10:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].warnings", contains("PERMANENTLY_CLOSED")));

        var newStart = new UpdateItineraryEntryStartRequest("10:00");
        mockMvc.perform(put(ITINERARY + "/entries/{entryId}/start", market).header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(newStart)))
                .andExpect(status().isNoContent());
        move(market, TOMORROW, null).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.days[1].entries[0].entryId").value(market))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value("2027-03-30T10:00+02:00"))
                .andExpect(jsonPath("$.days[1].entries[0].warnings", contains("PERMANENTLY_CLOSED")));
        checkItinerary();

        putFact(closure, new UpdateAttractionPermanentlyClosedRequest(false));

        saved().andExpect(jsonPath("$.days[1].entries[0].entryId").value(market))
                .andExpect(jsonPath("$.days[1].entries[0].warnings").isEmpty())
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"));
        assertSourceChanges(new SourceChange(PERMANENT_CLOSURE, "PERMANENTLY_CLOSED", "NOT_PERMANENTLY_CLOSED", false));
    }

    @Test
    void removingAClosedAttractionsEntryFromAPastTripDoesNotMakeItEligibleForScheduling() throws Exception {
        var past = LocalDate.parse("2020-02-03");
        seedTrip(past, past, 1);
        var market = schedule(1L, past, "09:00");
        var closure = "/attractions/1/permanently-closed";
        putFact(closure, new UpdateAttractionPermanentlyClosedRequest(true));

        remove(market).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions").isEmpty());

        var request = new ScheduleAttractionRequest(1L, past, "09:00", "Europe/Belgrade", null);
        mockMvc.perform(post(ITINERARY + "/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "Only attractions on the Top Attractions or Secondary Spots board that are not permanently closed can be added."));

        putFact(closure, new UpdateAttractionPermanentlyClosedRequest(false));
        saved().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(1)));
    }

    @Test
    void aCheckAcceptsOutstandingWarningsWithoutResolvingThem() throws Exception {
        seedTrip(TODAY, TODAY, 1);
        var visitTime = "/trips/1/attractions/1/visit-time";
        putFact(visitTime, new UpdateTripAttractionVisitTimeRequest("2-3h"));
        var market = schedule(1L, TODAY, "09:00");
        var plannedLength = new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(150));
        mockMvc.perform(put(ITINERARY + "/entries/{entryId}/planned-length", market).header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(plannedLength)))
                .andExpect(status().isNoContent());
        checkItinerary();

        putFact(visitTime, new UpdateTripAttractionVisitTimeRequest("3-4h"));
        putFact("/attractions/1/permanently-closed", new UpdateAttractionPermanentlyClosedRequest(true));
        putFact("/trips/1/attractions/1/note", new UpdateTripAttractionNoteRequest("Use the side gate"));

        var displayed = saved().andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-03-29T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T11:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].tripNote").value("Use the side gate"))
                .andExpect(jsonPath("$.days[0].entries[0].warnings",
                        contains("PERMANENTLY_CLOSED", "PLANNED_LENGTH_OUTSIDE_SOURCE_RANGE")))
                .andReturn().getResponse().getContentAsString();

        submitCheck(new CheckItineraryRequest(JsonPath.read(displayed, "$.checkContext")))
                .andExpect(status().isNoContent());
        var checked = saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty())
                .andExpect(jsonPath("$.days[0].entries[0].warnings",
                        contains("PERMANENTLY_CLOSED", "PLANNED_LENGTH_OUTSIDE_SOURCE_RANGE")))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-03-29T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T11:30+02:00"))
                .andReturn().getResponse().getContentAsString();
        saved().andExpect(content().json(checked, JsonCompareMode.STRICT));

        putFact(visitTime, new UpdateTripAttractionVisitTimeRequest("2h 30m-3h"));
        saved().andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.lastCheckedAt").value(JsonPath.read(checked, "$.lastCheckedAt").toString()))
                .andExpect(jsonPath("$.days[0].entries[0].warnings", contains("PERMANENTLY_CLOSED")));
        assertSourceChanges(new SourceChange(VISIT_DURATION, "3-4h", "2h 30m-3h", false));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"as long as needed", "4-3h"})
    void missingOrInvalidSourceDurationKeepsTheSavedLengthWithAWarning(String visitTime) throws Exception {
        seedTrip(TODAY, TODAY, 1);
        var market = schedule(1L, TODAY, "09:00");

        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest(visitTime));

        saved().andExpect(jsonPath("$.days[0].entries[0].entryId").value(market))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value("2027-03-29T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T10:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].warnings", contains("UNUSABLE_SOURCE_DURATION")));
    }

    @Test
    void unwatchedCatalogueEditsAndUnscheduledChangesDoNotInvalidateTheDisplayedContext() throws Exception {
        seedTrip(TODAY, TODAY, 2);
        putFact("/attractions/1/detail", new UpdateAttractionDetailRequest("Market", null));
        schedule(1L, TODAY, "09:00");
        var displayed = readCheckRequest();

        putFact("/attractions/1/detail", new UpdateAttractionDetailRequest("Market Hall", null));
        putFact("/attractions/1/traditional", new UpdateAttractionTraditionalRequest(false));
        putFact("/attractions/1/informationProvider", new UpdateAttractionInformationProviderRequest(
                "Planning provider 2", LocalDate.parse("2026-11-01")));
        putFact("/attractions/1/visit", new UpdateAttractionVisitRequest(false));
        putFact("/trips/1/attractions/2/note", new UpdateTripAttractionNoteRequest("An unscheduled attraction"));
        putFact("/trips/1/attractions/1/working-hours", new UpdateTripAttractionWorkingHoursRequest("09:00-17:00"));

        submitCheck(displayed).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty())
                .andExpect(jsonPath("$.days[0].entries[0].name").value("Market Hall"))
                .andExpect(jsonPath("$.days[0].entries[0].mustVisit").value(true));
        mockMvc.perform(get("/attractions/1").header("x-api-version", "1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.isTraditional").value(false))
                .andExpect(jsonPath("$.infoFrom").value("Planning provider 2"))
                .andExpect(jsonPath("$.mustVisit").value(false));
    }

    @Test
    void removingAnEntryKeepsRemovalContextAndReschedulingStartsAFreshBaseline() throws Exception {
        seedTrip(TODAY, TODAY, 1);
        var market = schedule(1L, TODAY, "09:00");
        checkItinerary();
        putFact("/trips/1/attractions/1/note", new UpdateTripAttractionNoteRequest("Side gate"));
        assertSourceChanges(new SourceChange(TRIP_NOTE, "Trip note", "Side gate", false));

        remove(market).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].subject").value("Market"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("ENTRY_REMOVED")))
                .andExpect(jsonPath("$.changeNotices[0].entryId").doesNotExist())
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges").doesNotExist());

        var newMarket = schedule(1L, TODAY, "09:00");
        assertThat(newMarket).isNotEqualTo(market);
        putFact("/trips/1/attractions/1/note", new UpdateTripAttractionNoteRequest("Main gate"));
        saved().andExpect(jsonPath("$.changeNotices[0].entryId").value(newMarket))
                .andExpect(jsonPath("$.changeNotices[0].sourceBaseline").value("WHEN_SCHEDULED"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].baseline").value("Side gate"))
                .andExpect(jsonPath("$.changeNotices[0].sourceChanges[0].current").value("Main gate"));
    }

    @Test
    void updatingAttractionHoursDurationAndNoteDoesNotRescheduleVisitsOrAffectOtherTrips() throws Exception {
        seedTrip();
        entityManager.createNativeQuery("""
                UPDATE trip SET trip_start_date = :date, trip_end_date = :date WHERE id = 2;
                INSERT INTO itinerary(trip_id) VALUES (2);
                INSERT INTO itinerary_day(trip_id, date) VALUES (2, :date);
                INSERT INTO trip_attraction(id, trip_id, attraction_id, created_on, status, attraction_group,
                    board_position, must_visit, working_hours, visit_time, note)
                VALUES (6, 2, 1, CURRENT_TIMESTAMP, 'PLANNED', 'SECONDARY', 1, false,
                    '14:00-20:00', '30m', 'Evening market');
                """).setParameter("date", TODAY).executeUpdate();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");

        putFact("/trips/1/attractions/1/working-hours", new UpdateTripAttractionWorkingHoursRequest("10:00-16:00"));
        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest("2h"));
        putFact("/trips/1/attractions/1/note", new UpdateTripAttractionNoteRequest("Try the bakery"));
        putFact("/attractions/1/tip", new UpdateAttractionTipRequest("Enter from the square"));

        saved().andExpect(jsonPath("$.days[0].entries[*].entryId", contains(market.intValue(), garden.intValue())))
                .andExpect(jsonPath("$.days[1].entries").isEmpty())
                .andExpect(jsonPath("$.days[0].entries[*].timing.start",
                        contains("2027-03-29T09:00+02:00", "2027-03-29T13:00+02:00")))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T10:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].workingHours").value("10:00-16:00"))
                .andExpect(jsonPath("$.days[0].entries[0].visitDuration").value("2h"))
                .andExpect(jsonPath("$.days[0].entries[0].tripNote").value("Try the bakery"));
        assertSourceChanges(new SourceChange(WORKING_HOURS, "09:00-17:00", "10:00-16:00", false),
                new SourceChange(VISIT_DURATION, "1h 30m", "2h", false),
                new SourceChange(TRIP_NOTE, "Trip note", "Try the bakery", false),
                new SourceChange(CATALOGUE_TIP, "Catalogue tip", "Enter from the square", false));
        mockMvc.perform(get("/trips/2/itinerary").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unscheduledAttractions[0].attractionId").value(1))
                .andExpect(jsonPath("$.unscheduledAttractions[0].workingHours").value("14:00-20:00"))
                .andExpect(jsonPath("$.unscheduledAttractions[0].visitDuration").value("30m"))
                .andExpect(jsonPath("$.unscheduledAttractions[0].tripNote").value("Evening market"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
        mockMvc.perform(get("/attractions/1").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tip").value("Enter from the square"));
    }

    private void assertSourceChanges(SourceChange... expected) throws Exception {
        var response = saved().andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andReturn().getResponse().getContentAsString();
        var notice = mapper.readValue(response, GetItineraryResponse.class).changeNotices().getFirst();
        assertThat(notice.sourceChanges()).containsExactly(expected);
    }

    private void putFact(String path, Object request) throws Exception {
        mockMvc.perform(put(path).header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }

    private ResultActions moveOnBoard(MoveAttractionOnBoardRequest move) throws Exception {
        return mockMvc.perform(put("/trips/1/board/attractions/1").header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(move)));
    }

    private ResultActions remove(long entryId) throws Exception {
        return mockMvc.perform(delete(ITINERARY + "/entries/{entryId}", entryId).header("x-api-version", "1"));
    }

    private void checkItinerary() throws Exception {
        submitCheck(readCheckRequest()).andExpect(status().isNoContent());
    }

    private CheckItineraryRequest readCheckRequest() throws Exception {
        return new CheckItineraryRequest(JsonPath.read(saved().andReturn().getResponse().getContentAsString(), "$.checkContext"));
    }

    private ResultActions submitCheck(CheckItineraryRequest request) throws Exception {
        return mockMvc.perform(post(ITINERARY + "/check").header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)));
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
        seedTrip(first, last, 5);
    }

    private void seedTrip(LocalDate first, LocalDate last, int attractionCount) {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, attractionCount);
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
