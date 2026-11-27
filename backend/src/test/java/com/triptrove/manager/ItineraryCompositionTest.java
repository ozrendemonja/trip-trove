package com.triptrove.manager;

import com.jayway.jsonpath.JsonPath;
import com.triptrove.manager.application.dto.AttractionCategoryDTO;
import com.triptrove.manager.application.dto.AttractionTypeDTO;
import com.triptrove.manager.application.dto.CheckItineraryRequest;
import com.triptrove.manager.application.dto.DateSpanDTO;
import com.triptrove.manager.application.dto.GetItineraryResponse;
import com.triptrove.manager.application.dto.GetItineraryResponse.ChangeNotice.SourceChange;
import com.triptrove.manager.application.dto.ItineraryRemovalRequest;
import com.triptrove.manager.application.dto.ItineraryTransferDTO;
import com.triptrove.manager.application.dto.JoinItineraryAttractionRequest;
import com.triptrove.manager.application.dto.LocationDTO;
import com.triptrove.manager.application.dto.MoveAttractionOnBoardRequest;
import com.triptrove.manager.application.dto.MoveItineraryEntryRequest;
import com.triptrove.manager.application.dto.RemoveItineraryEntryRequest;
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
import com.triptrove.manager.application.dto.UpdateItineraryTransferRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionMustVisitRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionNoteRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionVisitTimeRequest;
import com.triptrove.manager.application.dto.UpdateTripAttractionWorkingHoursRequest;
import com.triptrove.manager.domain.model.TransferMode;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
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
import java.util.List;
import java.util.Map;

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
    void joiningAnUnscheduledAttractionExtendsTheHostAndMovesOnlyTheOverlappingEntry() throws Exception {
        seedTrip();
        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest("30-45m"));
        putFact("/trips/1/attractions/3/visit-time", new UpdateTripAttractionVisitTimeRequest("3-5m"));
        var host = schedule(1L, TODAY, "09:00");
        schedule(2L, TODAY, "09:47");
        schedule(4L, TODAY, "15:00");
        lock(host);
        checkItinerary();

        join(host, new JoinItineraryAttractionRequest(3L, null, null, null))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost" + ITINERARY))
                .andExpect(content().string(""));

        saved().andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(
                        "2027-03-29T09:00+02:00", "2027-03-29T09:50+02:00", "2027-03-29T15:00+02:00")))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T09:50+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(true))
                .andExpect(jsonPath("$.days[0].entries[0].groupedAttractions[0].attractionId").value(3))
                .andExpect(jsonPath("$.days[0].entries[0].groupedAttractions[0].contributionMinutes").value(5))
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(5)))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[0].entryId").value(host))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("PLANNED_LENGTH_CHANGED", "GROUP_CHANGED")));
    }

    @Test
    void joiningAScheduledAttractionToAGroupRequiresConfirmingRemovalOfItsTransfers() throws Exception {
        seedTrip();
        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest("30-45m"));
        putFact("/trips/1/attractions/2/visit-time", new UpdateTripAttractionVisitTimeRequest("5-15m"));
        putFact("/trips/1/attractions/2/note", new UpdateTripAttractionNoteRequest("Use the south entrance."));
        var host = schedule(1L, TODAY, "09:00");
        var standalone = schedule(2L, TODAY, "10:30");
        var next = schedule(3L, TODAY, "12:00");
        lock(standalone);
        lock(host);
        putFact(ITINERARY + "/entries/" + standalone + "/planned-length",
                new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(5)));
        putTransfer(host, standalone, walking(0)).andExpect(status().isNoContent());
        putTransfer(standalone, next, walking(10)).andExpect(status().isNoContent());
        checkItinerary();
        putFact("/trips/1/attractions/2/note", new UpdateTripAttractionNoteRequest("Use the north entrance."));
        putFact("/attractions/2/permanently-closed", new UpdateAttractionPermanentlyClosedRequest(true));
        var before = saved().andReturn().getResponse().getContentAsString();
        var original = mapper.readValue(before, GetItineraryResponse.class).days().getFirst().entries();
        var transfersToRemove = List.of(original.getFirst().outgoingTransfer(), original.get(1).outgoingTransfer());

        mockMvc.perform(post(ITINERARY + "/entries/{hostEntryId}/grouped-attractions", host)
                        .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("attractionId", 2L, "standaloneEntryId", standalone,
                                "transfersToRemoveWithSourceEntry", transfersToRemove))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The saved entry changed. Refresh the itinerary and review the move again."));
        mockMvc.perform(post(ITINERARY + "/entries/{hostEntryId}/grouped-attractions", host)
                        .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("attractionId", 2L, "sourceEntryId", standalone,
                                "transfersToRemove", transfersToRemove))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage").value("Review and confirm the transfers this change would remove."));
        join(host, new JoinItineraryAttractionRequest(2L, standalone, null, null))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage").value("Review and confirm the transfers this change would remove."))
                .andExpect(jsonPath("$.transfersToRemove[*].transfer.minutes", contains(0, 10)));
        join(host, new JoinItineraryAttractionRequest(2L, standalone, "5m", transfersToRemove))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("{durationCorrectionForUnscheduledAttraction = "
                        + "omit visitDuration when sourceEntryId is set; the source entry's planned length is used}"));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));

        join(host, new JoinItineraryAttractionRequest(2L, standalone, null, transfersToRemove))
                .andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].entryId", contains(host.intValue(), next.intValue())))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T09:50+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer").doesNotExist())
                .andExpect(jsonPath("$.days[0].entries[0].groupedAttractions[0].contributionMinutes").value(5))
                .andExpect(jsonPath("$.days[0].entries[0].groupedAttractions[0].tripNote").value("Use the north entrance."))
                .andExpect(jsonPath("$.days[0].entries[0].groupedAttractions[0].fixedStart").doesNotExist())
                .andExpect(jsonPath("$.days[0].entries[0].groupedAttractions[0].warnings", contains("PERMANENTLY_CLOSED")))
                .andExpect(jsonPath("$.changeNotices[0].groupedSourceChanges[0].sourceBaseline").value("AT_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[0].groupedSourceChanges[0].sourceChanges[0].baseline")
                        .value("Use the south entrance."));
    }

    @Test
    void changingTheGroupTotalChangesOnlyTheHostAllocationAndMovingKeepsMemberOrder() throws Exception {
        seedTrip();
        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest("30-45m"));
        putFact("/trips/1/attractions/3/visit-time", new UpdateTripAttractionVisitTimeRequest("5m"));
        putFact("/trips/1/attractions/2/visit-time", new UpdateTripAttractionVisitTimeRequest("0m"));
        var host = schedule(1L, TODAY, "09:00");
        lock(host);
        join(host, new JoinItineraryAttractionRequest(3L, null, null, null)).andExpect(status().isNoContent());
        checkItinerary();
        join(host, new JoinItineraryAttractionRequest(2L, null, null, null)).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.changeNotices[0].reasons", contains("GROUP_CHANGED")));

        putFact(ITINERARY + "/entries/" + host + "/planned-length",
                new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(35)));
        mockMvc.perform(put(ITINERARY + "/entries/{id}/planned-length", host).header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(34)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The group's planned length for Market must be between 35 and 50 minutes."));

        move(host, TOMORROW, null).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.days[1].entries[0].fixedStart").value(true))
                .andExpect(jsonPath("$.days[1].entries[0].timing.end").value("2027-03-30T09:35+02:00"))
                .andExpect(jsonPath("$.days[1].entries[0].groupedAttractions[*].attractionId", contains(3, 2)))
                .andExpect(jsonPath("$.days[1].entries[0].groupedAttractions[*].contributionMinutes", contains(5, 0)));
    }

    @Test
    void missingDurationIsCorrectedOnlyIfTheJoinFitsAndBecomesTheMemberBaseline() throws Exception {
        seedTrip();
        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest("45m"));
        entityManager.createNativeQuery("UPDATE trip_attraction SET visit_time = NULL WHERE id = 3").executeUpdate();
        var host = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "09:47");
        lock(garden);
        var before = saved().andReturn().getResponse().getContentAsString();

        join(host, new JoinItineraryAttractionRequest(3L, null, null, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("Enter the required details to add this attraction."))
                .andExpect(jsonPath("$.schedulingInputs.requiredInputs", contains("VISIT_DURATION")));
        join(host, new JoinItineraryAttractionRequest(3L, null, "5m", null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "That timing conflicts with the fixed start of Garden. Choose another clock or length."));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));

        join(host, new JoinItineraryAttractionRequest(3L, null, "0m", null)).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.changeNotices").isEmpty())
                .andExpect(jsonPath("$.days[0].entries[0].groupedAttractions[0].visitDuration").value("0m"))
                .andExpect(jsonPath("$.days[0].entries[0].groupedAttractions[0].contributionMinutes").value(0));
        var checkBeforeSourceChange = readCheckRequest();
        putFact("/trips/1/attractions/3/visit-time", new UpdateTripAttractionVisitTimeRequest("5m"));
        submitCheck(checkBeforeSourceChange)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("ITINERARY_CHECK_STALE"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "The itinerary or its attraction sources changed. Refresh and review the itinerary before checking again."));
        saved().andExpect(jsonPath("$.changeNotices[0].entryId").value(host))
                .andExpect(jsonPath("$.changeNotices[0].groupedSourceChanges[0].sourceBaseline").value("WHEN_SCHEDULED"))
                .andExpect(jsonPath("$.changeNotices[0].groupedSourceChanges[0].sourceChanges[0].baseline").value("0m"))
                .andExpect(jsonPath("$.days[0].entries[0].groupedAttractions[0].warnings",
                        contains("PLANNED_LENGTH_OUTSIDE_SOURCE_RANGE")));
        checkItinerary();
        saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void groupingSchedulesEachAttractionOnceAndRejectsNestedOrIneligibleAttractions() throws Exception {
        seedTrip();
        var host = schedule(1L, TODAY, "09:00");
        var other = schedule(2L, TOMORROW, "09:00");
        join(host, new JoinItineraryAttractionRequest(3L, null, null, null)).andExpect(status().isNoContent());
        putFact("/trips/1/attractions/4/group", new UpdateAttractionGroupRequest(TripAttractionGroupDTO.EXCLUDED, null));
        var before = saved().andReturn().getResponse().getContentAsString();

        join(other, new JoinItineraryAttractionRequest(1L, host, null, null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("An entry cannot join itself or join another entry while it hosts grouped attractions."));
        join(other, new JoinItineraryAttractionRequest(2L, other, null, null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("An entry cannot join itself or join another entry while it hosts grouped attractions."));
        join(other, new JoinItineraryAttractionRequest(3L, null, null, null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("This attraction is already in the itinerary."));
        postSchedule(new ScheduleAttractionRequest(3L, TOMORROW, "20:00", null, null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("This attraction is already in the itinerary."));
        join(other, new JoinItineraryAttractionRequest(4L, null, null, null))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "Only attractions on the Top Attractions or Secondary Spots board that are not permanently closed can be added."));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));
    }

    @ParameterizedTest
    @EnumSource(TransferMode.class)
    void savingAnExplicitZeroTransferReplacesTheMissingTransferWarning(TransferMode mode) throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");
        saved().andExpect(jsonPath("$.days[0].entries[0].warnings", contains("MISSING_TRANSFER")))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer").doesNotExist());

        putTransfer(market, garden, new UpdateItineraryTransferRequest(
                mode, BigDecimal.ZERO, "Across the square"))
                .andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost" + ITINERARY))
                .andExpect(content().string(""));

        saved().andExpect(jsonPath("$.days[0].entries[0].warnings").isEmpty())
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.toEntryId").value(garden))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.mode").value(mode.name()))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.minutes").value(0))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.distanceKm").doesNotExist())
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.note").value("Across the square"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value("2027-03-29T13:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].warnings").isEmpty());
    }

    @Test
    void transfersConsumeTheGapBeforePushingAndNeverMoveAFixedStart() throws Exception {
        seedTrip();
        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest("30-60m"));
        var market = schedule(1L, TODAY, "09:00");
        putFact(ITINERARY + "/entries/" + market + "/planned-length",
                new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(30)));
        var garden = schedule(2L, TODAY, "10:00");
        var park = schedule(3L, TODAY, "12:30");
        putTransfer(market, garden, walking(10)).andExpect(status().isNoContent());
        putTransfer(garden, park, walking(55)).andExpect(status().isNoContent());

        putFact(ITINERARY + "/entries/" + market + "/planned-length",
                new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(45)));
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value("2027-03-29T09:45+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value("2027-03-29T10:00+02:00"));
        lock(park);
        var before = saved().andReturn().getResponse().getContentAsString();

        mockMvc.perform(put(ITINERARY + "/entries/{id}/planned-length", market)
                        .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(60)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The 55-minute transfer from Garden to Park does not fit. Adjust the transfer or the entry times."));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));

        putFact(ITINERARY + "/entries/" + park + "/fixed-start", new UpdateItineraryEntryFixedStartRequest(false));
        putFact(ITINERARY + "/entries/" + market + "/planned-length",
                new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(60)));
        saved().andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(
                        "2027-03-29T09:00+02:00", "2027-03-29T10:10+02:00", "2027-03-29T12:35+02:00")))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.minutes").value(10))
                .andExpect(jsonPath("$.days[0].entries[1].outgoingTransfer.minutes").value(55));
    }

    @Test
    void aPositiveTransferDoesNotFitBetweenFixedBriefStopsAtTheSameMinute() throws Exception {
        seedTrip();
        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest("0m"));
        putFact("/trips/1/attractions/2/visit-time", new UpdateTripAttractionVisitTimeRequest("0m"));
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "09:00");
        lock(market);
        lock(garden);
        var before = saved().andReturn().getResponse().getContentAsString();

        putTransfer(market, garden, walking(1)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The 1-minute transfer from Market to Garden does not fit. Adjust the transfer or the entry times."));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));
    }

    @Test
    void aTransferCanExceedTwentyFourHoursWhenItFits() throws Exception {
        var longDay = LocalDate.parse("2027-10-31");
        seedTrip(longDay, longDay);
        putFact("/trips/1/attractions/1/visit-time", new UpdateTripAttractionVisitTimeRequest("0m"));
        putFact("/trips/1/attractions/2/visit-time", new UpdateTripAttractionVisitTimeRequest("0m"));
        var market = schedule(1L, longDay, "00:00");
        var garden = schedule(2L, longDay, "23:59");
        lock(garden);

        putTransfer(market, garden, new UpdateItineraryTransferRequest(TransferMode.TRAIN,
                BigDecimal.valueOf(1470), "R".repeat(512)))
                .andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.minutes").value(1470))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.note").value("R".repeat(512)))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value("2027-10-31T23:59+01:00"));
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            0.5 | 0   | {wholeMinutes = enter non-negative whole transfer minutes}
            0   | 513 | {note = size must be between 0 and 512}
            """)
    void invalidTransferFieldsAreRejectedWithoutTruncation(BigDecimal minutes, int noteLength, String message) throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");

        putTransfer(market, garden, new UpdateItineraryTransferRequest(
                TransferMode.WALKING, minutes, "R".repeat(noteLength)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(message));
        saved().andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer").doesNotExist());
    }

    @Test
    void checkingCanAcceptMissingTravelButAddingEditingAndRemovingItRequireAnotherCheck() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");
        checkItinerary();
        var checked = saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.days[0].entries[0].warnings", contains("MISSING_TRANSFER")))
                .andReturn().getResponse().getContentAsString();
        var staleCheck = new CheckItineraryRequest(mapper.readValue(checked, GetItineraryResponse.class).checkContext());
        saved().andExpect(content().json(checked, JsonCompareMode.STRICT));

        putTransfer(market, garden, walking(10)).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("TRANSFER_CHANGED")))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.distanceKm").doesNotExist());
        submitCheck(staleCheck).andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("ITINERARY_CHECK_STALE"));
        checkItinerary();
        checked = saved().andReturn().getResponse().getContentAsString();
        putTransfer(market, garden, walking(10)).andExpect(status().isNoContent());
        saved().andExpect(content().json(checked, JsonCompareMode.STRICT));

        putTransfer(market, garden, new UpdateItineraryTransferRequest(
                TransferMode.BUS, BigDecimal.TEN, null)).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer.mode").value("BUS"));
        checkItinerary();

        mockMvc.perform(delete(ITINERARY + "/transfers/{fromEntryId}/{toEntryId}", market, garden)
                        .header("x-api-version", "1"))
                .andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.days[0].entries[0].warnings", contains("MISSING_TRANSFER")))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value("2027-03-29T13:00+02:00"));
    }

    @Test
    void insertingFromThePoolListsOnlyTheTransferToRemoveAndKeepsAllClocks() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");
        var gallery = schedule(4L, TODAY, "16:00");
        putTransfer(market, garden, walking(60)).andExpect(status().isNoContent());
        putTransfer(garden, gallery, walking(10)).andExpect(status().isNoContent());
        var before = saved().andReturn().getResponse().getContentAsString();
        var transfer = mapper.readValue(before, GetItineraryResponse.class).days().getFirst().entries().getFirst()
                .outgoingTransfer();

        postSchedule(new ScheduleAttractionRequest(3L, TODAY, "11:00", null, null))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage").value("Review and confirm the transfers this change would remove."))
                .andExpect(jsonPath("$.transfersToRemove[0].fromName").value("Market"))
                .andExpect(jsonPath("$.transfersToRemove[0].toName").value("Garden"))
                .andExpect(jsonPath("$.transfersToRemove[0].transfer.minutes").value(60));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));

        postSchedule(new ScheduleAttractionRequest(3L, TODAY, "11:00", null, null, null, List.of(transfer)))
                .andExpect(status().isNoContent());
        var inserted = saved().andExpect(jsonPath("$.days[0].entries[*].name", contains("Market", "Park", "Garden", "Gallery")))
                .andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(
                        "2027-03-29T09:00+02:00", "2027-03-29T11:00+02:00", "2027-03-29T13:00+02:00", "2027-03-29T16:00+02:00")))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer").doesNotExist())
                .andExpect(jsonPath("$.days[0].entries[1].outgoingTransfer").doesNotExist())
                .andExpect(jsonPath("$.days[0].entries[2].outgoingTransfer.toEntryId").value(gallery))
                .andReturn().getResponse().getContentAsString();
        var park = mapper.readValue(inserted, GetItineraryResponse.class).days().getFirst().entries().get(1);
        remove(park.entryId()).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].warnings", contains("MISSING_TRANSFER")))
                .andExpect(jsonPath("$.days[0].entries[0].outgoingTransfer").doesNotExist());
    }

    @Test
    void movingAcrossDaysDisclosesBothFormerNeighboursAndTheTransferAtTheDestination() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");
        var park = schedule(3L, TODAY, "17:00");
        var gallery = schedule(4L, TOMORROW, "09:00");
        var lookout = schedule(5L, TOMORROW, "13:00");
        putTransfer(market, garden, walking(10)).andExpect(status().isNoContent());
        putTransfer(garden, park, walking(20)).andExpect(status().isNoContent());
        putTransfer(gallery, lookout, walking(30)).andExpect(status().isNoContent());
        var before = saved().andReturn().getResponse().getContentAsString();

        move(garden, TOMORROW, lookout).andExpect(status().isConflict())
                .andExpect(jsonPath("$.transfersToRemove[*].fromName", contains("Market", "Garden", "Gallery")))
                .andExpect(jsonPath("$.transfersToRemove[*].toName", contains("Garden", "Park", "Lookout")));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));

        var snapshot = mapper.readValue(before, GetItineraryResponse.class);
        var transfersToRemove = List.of(snapshot.days().getFirst().entries().getFirst().outgoingTransfer(),
                snapshot.days().getFirst().entries().get(1).outgoingTransfer(),
                snapshot.days().get(1).entries().getFirst().outgoingTransfer());
        move(garden, new MoveItineraryEntryRequest(TOMORROW, lookout, null, transfersToRemove))
                .andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].name", contains("Market", "Park")))
                .andExpect(jsonPath("$.days[1].entries[*].name", contains("Gallery", "Garden", "Lookout")))
                .andExpect(jsonPath("$.days[1].entries[1].timing.start").value("2027-03-30T10:30+02:00"))
                .andExpect(jsonPath("$.days[*].entries[*].outgoingTransfer").isEmpty());
    }

    @Test
    void entryRemovalAndBoardExclusionRequireTheCurrentTransferDetails() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var garden = schedule(2L, TODAY, "13:00");
        var park = schedule(3L, TODAY, "17:00");
        putTransfer(market, garden, walking(10)).andExpect(status().isNoContent());
        putTransfer(garden, park, walking(20)).andExpect(status().isNoContent());
        checkItinerary();
        var before = saved().andReturn().getResponse().getContentAsString();
        var entries = mapper.readValue(before, GetItineraryResponse.class).days().getFirst().entries();

        remove(garden).andExpect(status().isConflict())
                .andExpect(jsonPath("$.transfersToRemove[*].fromName", contains("Market", "Garden")));
        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.EXCLUDED, null, null,
                new ItineraryRemovalRequest(market, List.of(
                        new ItineraryTransferDTO(market, garden, TransferMode.WALKING, 11, null)))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.transfersToRemove[0].transfer.minutes").value(10))
                .andExpect(jsonPath("$.transfersToRemove[0].transfer.distanceKm").doesNotExist());
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));

        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.EXCLUDED, null, null,
                new ItineraryRemovalRequest(market, List.of(entries.getFirst().outgoingTransfer()))))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete(ITINERARY + "/entries/{id}", garden)
                        .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new RemoveItineraryEntryRequest(
                                List.of(entries.get(1).outgoingTransfer())))))
                .andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].name", contains("Park")))
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 4, 5)));
    }

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
        var itineraryRemoval = new ItineraryRemovalRequest(market);

        mockMvc.perform(delete("/trips/1/attractions/1").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(itineraryRemoval)))
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
    void boardExclusionWithPreMoveItineraryRemovalRemovesTheVisitAndReinclusionRestoresOnlyThePoolEntry() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        checkItinerary();
        var itineraryRemoval = new ItineraryRemovalRequest(market);
        move(market, TOMORROW, null).andExpect(status().isNoContent());

        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.EXCLUDED, null, null, itineraryRemoval))
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
    void excludingWithTheItineraryRemovalOfAReplacedEntryRequiresANewOne() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var oldItineraryRemoval = new ItineraryRemovalRequest(market);
        remove(market).andExpect(status().isNoContent());
        var rescheduledMarket = schedule(1L, TODAY, "09:00");
        var before = saved().andReturn().getResponse().getContentAsString();

        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.EXCLUDED, null, null, oldItineraryRemoval))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_HAS_DEPENDENCIES"))
                .andExpect(jsonPath("$.errorMessage")
                        .value("The itinerary consequences changed. Review them and confirm the board change again."));
        saved().andExpect(content().json(before, JsonCompareMode.STRICT));

        var newItineraryRemoval = new ItineraryRemovalRequest(rescheduledMarket);
        moveOnBoard(new MoveAttractionOnBoardRequest(TripAttractionGroupDTO.EXCLUDED, null, null, newItineraryRemoval))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/trips/1/attractions").header("x-api-version", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.attractionId == 1)].attractionGroup", contains("EXCLUDED")));
        saved().andExpect(jsonPath("$.days[0].entries").isEmpty())
                .andExpect(jsonPath("$.unscheduledAttractions[*].attractionId", contains(2, 3, 4, 5)));
    }

    @Test
    void groupUpdateToExcludedWithItsItineraryRemovalBeforeTheFirstCheckRemovesTheVisitWithoutAPoolEntryOrChangeNotice() throws Exception {
        seedTrip();
        var market = schedule(1L, TODAY, "09:00");
        var itineraryRemoval = new ItineraryRemovalRequest(market);
        var request = new UpdateAttractionGroupRequest(TripAttractionGroupDTO.EXCLUDED, itineraryRemoval);

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

    private ResultActions putTransfer(long from, long to, UpdateItineraryTransferRequest request) throws Exception {
        return mockMvc.perform(put(ITINERARY + "/transfers/{fromEntryId}/{toEntryId}", from, to)
                .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)));
    }

    private static UpdateItineraryTransferRequest walking(int minutes) {
        return new UpdateItineraryTransferRequest(TransferMode.WALKING, BigDecimal.valueOf(minutes), null);
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
        postSchedule(new ScheduleAttractionRequest(attractionId, date, clock, "Europe/Belgrade", null))
                .andExpect(status().isNoContent());
        return mapper.readValue(saved().andReturn().getResponse().getContentAsString(), GetItineraryResponse.class)
                .days().stream().flatMap(day -> day.entries().stream())
                .filter(entry -> entry.attractionId() == attractionId)
                .findFirst().orElseThrow().entryId();
    }

    private ResultActions postSchedule(ScheduleAttractionRequest request) throws Exception {
        return mockMvc.perform(post(ITINERARY + "/attractions").header("x-api-version", "1")
                .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request)));
    }

    private ResultActions join(long hostEntryId, JoinItineraryAttractionRequest request) throws Exception {
        return mockMvc.perform(post(ITINERARY + "/entries/{hostEntryId}/grouped-attractions", hostEntryId)
                .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)));
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
