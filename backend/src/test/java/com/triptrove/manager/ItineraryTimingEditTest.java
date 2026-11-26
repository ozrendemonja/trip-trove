package com.triptrove.manager;

import com.triptrove.manager.application.dto.CheckItineraryRequest;
import com.triptrove.manager.application.dto.GetItineraryResponse;
import com.triptrove.manager.application.dto.ScheduleAttractionRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryEndRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryFixedStartRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryPlannedLengthRequest;
import com.triptrove.manager.application.dto.UpdateItineraryEntryStartRequest;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
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
import java.util.Map;
import java.util.stream.Stream;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
class ItineraryTimingEditTest extends AbstractIntegrationTest {
    private static final String ITINERARY = "/trips/1/itinerary";
    private static final String DAY = "2027-03-29";
    private static final String TOMORROW = "2027-03-30";
    private static final String SPRING_CLOCK_CHANGE = "2027-03-28";
    private static final String AUTUMN_CLOCK_CHANGE = "2027-10-31";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JsonMapper mapper;

    @Test
    void lockingStart_savesLockWithoutMovingVisit() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "30m");

        putFixedStart(museum, true).andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost" + ITINERARY))
                .andExpect(content().string(""));

        saved().andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(true))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T09:30+02:00"))
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void extendingAnEntryCanUseFreeTimeButCannotPushTheNextFixedStart() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "07:00", 30, false, "30m-3h");
        var garden = entry(2, "Garden", DAY, 2, "09:30", 30, false, "30-45m");
        putFixedStart(garden, true).andExpect(status().isNoContent());

        putEnd(museum, DAY, "09:25").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T09:25+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value(DAY + "T09:30+02:00"));

        rejected(putEnd(museum, DAY, "09:45"),
                "That timing conflicts with the fixed start of Garden. Choose another clock or length.");
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T09:25+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value(DAY + "T09:30+02:00"));

        putEnd(garden, DAY, "10:15").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T10:15+02:00"))
                .andExpect(jsonPath("$.days[0].entries[*].fixedStart", contains(false, true)));

        putFixedStart(garden, false).andExpect(status().isNoContent());
        putEnd(museum, DAY, "09:45").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].fixedStart", contains(false, false)))
                .andExpect(jsonPath("$.days[0].entries[*].timing.start",
                        contains(DAY + "T07:00+02:00", DAY + "T09:45+02:00")))
                .andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T10:30+02:00"));
    }

    @Test
    void insertingFromThePoolNamesTheFixedStartItConflictsWith() throws Exception {
        seedTrip(DAY, DAY);
        var garden = entry(1, "Garden", DAY, 1, "09:30", 30, false, "30m");
        putFixedStart(garden, true).andExpect(status().isNoContent());
        entityManager.createNativeQuery("UPDATE trip_attraction SET visit_time = '30m' WHERE id = 2").executeUpdate();

        var request = new ScheduleAttractionRequest(2L, LocalDate.parse(DAY), "09:15", null, null);
        rejected(mockMvc.perform(post(ITINERARY + "/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))),
                "The chosen time conflicts with the fixed start of Garden. Choose another start or day.");

        saved().andExpect(jsonPath("$.days[0].entries.length()").value(1))
                .andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(true))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T09:30+02:00"));
    }

    @Test
    void aTripCannotLockAnEntryBelongingToAnotherTrip() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "30m");

        mockMvc.perform(put("/trips/2/itinerary/entries/{entryId}/fixed-start", museum)
                        .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new UpdateItineraryEntryFixedStartRequest(true))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("OBJECT_NOT_FOUND"))
                .andExpect(jsonPath("$.errorMessage").value(
                        "The requested resource '%d' could not be found. Please refresh and try again.".formatted(museum)));
        saved().andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(false));
    }

    @Test
    void movingFixedStartWithoutBoardDuration_keepsLockAndLength() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, null);
        putFixedStart(museum, true).andExpect(status().isNoContent());

        putStart(museum, "09:30").andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost" + ITINERARY))
                .andExpect(content().string(""));

        saved().andExpect(jsonPath("$.days[0].entries[0].entryId").value(museum))
                .andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(true))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T09:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T10:00+02:00"))
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void plannedLengthEditWithoutBoardDuration_isRejected() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:30", 30, true, null);

        rejected(putPlannedLength(museum, 45),
                "Set a valid visit duration for Museum on the board before changing its planned length.");
    }

    @Test
    void endWithinGap_keepsNextVisitInPlace() throws Exception {
        var museum = seedMorningVisits(30, "10:00", "10:45");

        putEnd(museum, DAY, "09:50").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T09:50+02:00"))
                .andExpect(jsonPath("$.days[0].entries[2].timing.start").value(DAY + "T10:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[3].timing.start").value(DAY + "T10:45+02:00"));
    }

    @Test
    void endPastNextStart_movesOnlyTheOverlappingVisit() throws Exception {
        var museum = seedMorningVisits(50, "10:00", "10:45");

        putEnd(museum, DAY, "10:15").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T10:15+02:00"))
                .andExpect(jsonPath("$.days[0].entries[2].timing.start").value(DAY + "T10:15+02:00"))
                .andExpect(jsonPath("$.days[0].entries[3].timing.start").value(DAY + "T10:45+02:00"));
    }

    @Test
    void increasingPlannedLength_pushesOverlappingVisitsUntilNextGap() throws Exception {
        var museum = seedMorningVisits(75, "10:15", "10:45");

        putPlannedLength(museum, 90).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(DAY + "T08:00+02:00",
                        DAY + "T09:00+02:00", DAY + "T10:30+02:00", DAY + "T11:00+02:00", DAY + "T12:00+02:00")))
                .andExpect(jsonPath("$.days[0].entries[2].timing.end").value(DAY + "T11:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[3].timing.end").value(DAY + "T11:15+02:00"));
    }

    @Test
    void shorteningVisit_leavesLaterStartsUnchanged() throws Exception {
        var museum = seedMorningVisits(90, "10:30", "11:00");

        putEnd(museum, DAY, "09:25").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T09:25+02:00"))
                .andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(DAY + "T08:00+02:00",
                        DAY + "T09:00+02:00", DAY + "T10:30+02:00", DAY + "T11:00+02:00", DAY + "T12:00+02:00")));
    }

    @Test
    void movingStartEarlier_leavesLaterStartsUnchanged() throws Exception {
        var museum = seedMorningVisits(25, "10:30", "11:00");

        putStart(museum, "08:45").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(DAY + "T08:00+02:00",
                        DAY + "T08:45+02:00", DAY + "T10:30+02:00", DAY + "T11:00+02:00", DAY + "T12:00+02:00")))
                .andExpect(jsonPath("$.days[0].entries[1].fixedStart").value(false))
                .andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T09:10+02:00"));
    }

    private long seedMorningVisits(int museumMinutes, String gardenStart, String galleryStart) {
        seedTrip(DAY, DAY);
        entry(1, "Market", DAY, 1, "08:00", 30, false, "30m");
        var museum = entry(2, "Museum", DAY, 2, "09:00", museumMinutes, false, "15-90m");
        entry(3, "Garden", DAY, 3, gardenStart, 30, false, "30m");
        entry(4, "Gallery", DAY, 4, galleryStart, 15, false, "15m");
        entry(5, "Lookout", DAY, 5, "12:00", 30, true, "30m");
        return museum;
    }

    @ParameterizedTest
    @MethodSource("editsOutsideBoardDuration")
    void lengthOutsideBoardDuration_isRejectedWithoutChangingEnd(String field, Object request) throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "45m-1h");

        rejected(putTiming(museum, field, request),
                "The planned length for Museum must be within its current visit duration (45m-1h).");
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T09:30+02:00"));
    }

    private static Stream<Arguments> editsOutsideBoardDuration() {
        return Stream.of(
                Arguments.of("planned-length", new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(44))),
                Arguments.of("end", new UpdateItineraryEntryEndRequest(LocalDate.parse(DAY), "10:01"))
        );
    }

    @Test
    void endAtMinimumVisitDuration_isAccepted() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "45m-1h");

        putEnd(museum, DAY, "09:45").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T09:45+02:00"));
    }

    @ParameterizedTest
    @MethodSource("conflictingTimingEdits")
    void conflictWithPreviousVisitOrFixedStart_leavesCheckedItineraryUnchanged(String field, Object request, String message)
            throws Exception {
        seedTrip(DAY, DAY);
        entry(1, "Market", DAY, 1, "08:30", 30, false, "30m");
        var museum = entry(2, "Museum", DAY, 2, "09:00", 30, false, "30m-2h");
        entry(3, "Garden", DAY, 3, "10:00", 30, false, "30m");
        entry(4, "Gallery", DAY, 4, "10:45", 15, true, "15m");
        checkItinerary();

        rejected(putTiming(museum, field, request), message);
        saved().andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(
                        DAY + "T08:30+02:00", DAY + "T09:00+02:00", DAY + "T10:00+02:00", DAY + "T10:45+02:00")))
                .andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T09:30+02:00"))
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    private static Stream<Arguments> conflictingTimingEdits() {
        return Stream.of(
                Arguments.of("start", new UpdateItineraryEntryStartRequest("08:45"),
                        "That timing conflicts with Market. Choose another clock or length."),
                Arguments.of("planned-length", new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(90)),
                        "That timing conflicts with the fixed start of Gallery. Choose another clock or length.")
        );
    }

    @Test
    void endThatPushesNextVisitOntoAnotherDay_isRejected() throws Exception {
        seedTrip(DAY, TOMORROW);
        var museum = entry(1, "Museum", DAY, 1, "22:30", 30, false, "30m-2h");
        entry(2, "Lookout", DAY, 2, "23:30", 0, false, "0m");

        rejected(putEnd(museum, TOMORROW, "00:00"),
                "That change would push Lookout past its start date (2027-03-29). Choose another clock or length.");
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T23:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value(DAY + "T23:30+02:00"))
                .andExpect(jsonPath("$.days[1].entries").isEmpty());
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            2027-03-29 | Enter an end at or after the start that gives a length in whole minutes. Include the end date if it differs.
            2027-03-30 | That timing conflicts with Garden. Choose another clock or length.
            """)
    void endBeforeStartOrInsideNextVisit_isRejectedWithoutMovingVisits(String endDate, String message) throws Exception {
        seedTrip(DAY, TOMORROW);
        var museum = entry(1, "Museum", DAY, 1, "23:00", 30, false, "30m-2h");
        entry(2, "Garden", TOMORROW, 1, "00:30", 30, false, "30m");

        rejected(putEnd(museum, endDate, "01:00"), message);
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T23:30+02:00"))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value(TOMORROW + "T00:30+02:00"));
    }

    @Test
    void overnightEndAtNextVisitStart_keepsEntryOnOriginalDay() throws Exception {
        seedTrip(DAY, TOMORROW);
        var museum = entry(1, "Museum", DAY, 1, "23:00", 30, false, "30m-2h");
        var garden = entry(2, "Garden", TOMORROW, 1, "00:30", 30, false, "30m");
        putStart(garden, "01:00").andExpect(status().isNoContent());

        putEnd(museum, TOMORROW, "01:00").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries.length()").value(1))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T23:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(TOMORROW + "T01:00+02:00"))
                .andExpect(jsonPath("$.days[1].entries.length()").value(1))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value(TOMORROW + "T01:00+02:00"));
    }

    @Test
    void endAtMidnightAfterLastTripDay_isAccepted() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "23:00", 30, false, "30m-2h");

        putPlannedLength(museum, 60).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(TOMORROW + "T00:00+02:00"));
    }

    @Test
    void endOneMinutePastTripBoundary_isRejected() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "23:00", 60, false, "30m-2h");

        rejected(putPlannedLength(museum, 61), "Museum would end after the trip, which ends on 2027-03-29.");
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(TOMORROW + "T00:00+02:00"));
    }

    @Test
    void briefStopStartingAtTripBoundary_isRejected() throws Exception {
        seedTrip(DAY, DAY);
        entry(1, "Museum", DAY, 1, "23:00", 60, false, "30m-2h");
        entityManager.createNativeQuery("UPDATE trip_attraction SET visit_time = '0m' WHERE attraction_id = 2")
                .executeUpdate();

        var request = new ScheduleAttractionRequest(2L, LocalDate.parse(TOMORROW), "00:00", null, null);
        rejected(mockMvc.perform(post(ITINERARY + "/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(request))),
                "There is no itinerary day for 2027-03-30. Choose another day.");
        saved().andExpect(jsonPath("$.days[0].entries.length()").value(1))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(TOMORROW + "T00:00+02:00"));
    }

    @Test
    void briefStopInsidePreviousVisit_isRejected() throws Exception {
        seedTrip(DAY, DAY);
        entry(1, "Museum", DAY, 1, "09:00", 60, false, "50-90m");
        var first = entry(2, "First lookout", DAY, 2, "10:00", 0, false, "0m");

        rejected(putStart(first, "09:59"), "That timing conflicts with Museum. Choose another clock or length.");
    }

    @Test
    void briefStopsPushedToSameTime_keepManualOrder() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 60, false, "50-90m");
        entry(2, "First lookout", DAY, 2, "10:00", 0, false, "0m");
        entry(3, "Second lookout", DAY, 3, "10:00", 0, false, "0m");
        entry(4, "Garden", DAY, 4, "10:00", 45, false, "45m");

        putEnd(museum, DAY, "10:10").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].name",
                        contains("Museum", "First lookout", "Second lookout", "Garden")))
                .andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(
                        DAY + "T09:00+02:00", DAY + "T10:10+02:00", DAY + "T10:10+02:00", DAY + "T10:10+02:00")))
                .andExpect(jsonPath("$.days[0].entries[*].timing.end", contains(
                        DAY + "T10:10+02:00", DAY + "T10:10+02:00", DAY + "T10:10+02:00", DAY + "T10:55+02:00")));
    }

    @ParameterizedTest
    @MethodSource("springClockGapEdits")
    void enteredTimeInSpringClockGap_isRejected(String field, Object request) throws Exception {
        var date = SPRING_CLOCK_CHANGE;
        seedTrip(date, date);
        var museum = entry(1, "Museum", date, 1, "01:30", 30, false, "15-60m");

        rejected(putTiming(museum, field, request),
                "That " + field + " clock does not occur in Europe/Belgrade on this date. Choose another time.");
    }

    private static Stream<Arguments> springClockGapEdits() {
        return Stream.of(
                Arguments.of("start", new UpdateItineraryEntryStartRequest("02:30")),
                Arguments.of("end", new UpdateItineraryEntryEndRequest(LocalDate.parse(SPRING_CLOCK_CHANGE), "02:30"))
        );
    }

    @Test
    void visitCrossingSpringClockChange_keepsElapsedLength() throws Exception {
        var date = "2027-03-28";
        seedTrip(date, date);
        var museum = entry(1, "Museum", date, 1, "01:30", 30, false, "15-60m");

        putStart(museum, "01:45").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.start").value(date + "T01:45+01:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(date + "T03:15+02:00"));
    }

    @ParameterizedTest
    @MethodSource("repeatedHourTimingEdits")
    void enteredTimeInRepeatedHour_usesFirstOccurrence(String field, String originalStart, Object request, String expectedClock)
            throws Exception {
        var date = AUTUMN_CLOCK_CHANGE;
        seedTrip(date, date);
        var museum = entry(1, "Museum", date, 1, originalStart, 10, false, "10m-2h");

        putTiming(museum, field, request).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing." + field).value(date + "T" + expectedClock + "+02:00"));
    }

    private static Stream<Arguments> repeatedHourTimingEdits() {
        return Stream.of(
                Arguments.of("start", "03:00", new UpdateItineraryEntryStartRequest("02:30"), "02:30"),
                Arguments.of("end", "01:50",
                        new UpdateItineraryEntryEndRequest(LocalDate.parse(AUTUMN_CLOCK_CHANGE), "02:25"), "02:25")
        );
    }

    @Test
    void pushingVisitToSecondClockOccurrence_recordsStartChange() throws Exception {
        var date = "2027-10-31";
        seedTrip(date, date);
        var museum = entry(1, "Museum", date, 1, "01:50", 10, false, "10m-2h");
        var garden = entry(2, "Garden", date, 2, "03:00", 10, false, "10m");
        putStart(garden, "02:30").andExpect(status().isNoContent());
        putEnd(museum, date, "02:25").andExpect(status().isNoContent());
        checkItinerary();

        putPlannedLength(museum, 100).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(date + "T02:30+01:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value(date + "T02:30+01:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.end").value(date + "T02:40+01:00"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("PLANNED_LENGTH_CHANGED")))
                .andExpect(jsonPath("$.changeNotices[1].reasons", contains("START_CHANGED")));
    }

    @Test
    void unchangedStart_keepsItineraryManuallyChecked() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);

        putStart(museum, "10:00").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void lockChangesStayOnOneEntryNoticeUntilTheNextCheck() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);
        putFixedStart(museum, false).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());

        putFixedStart(museum, true).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].entryId").value(museum))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("FIXED_START_CHANGED")));

        putStart(museum, "10:15").andExpect(status().isNoContent());
        putFixedStart(museum, false).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("START_CHANGED", "FIXED_START_CHANGED")));

        putFixedStart(museum, true).andExpect(status().isNoContent());
        checkItinerary();
        saved().andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(true))
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());

        putFixedStart(museum, false).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(false))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T10:15+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T10:45+02:00"))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("FIXED_START_CHANGED")));

        checkItinerary();
        saved().andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(false))
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void movingCheckedStart_recordsStartChangeNotice() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);

        putStart(museum, "11:00").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T11:00+02:00"))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("START_CHANGED")));
    }

    @Test
    void restoringOriginalStart_keepsStartChangeNotice() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);
        putStart(museum, "11:00").andExpect(status().isNoContent());

        putStart(museum, "10:00").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T10:00+02:00"))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("START_CHANGED")));
    }

    @Test
    void restoringStartAndLength_keepsBothReasonsOnOneNotice() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);
        putStart(museum, "11:00").andExpect(status().isNoContent());
        putStart(museum, "10:00").andExpect(status().isNoContent());

        putPlannedLength(museum, 60).andExpect(status().isNoContent());
        putPlannedLength(museum, 30).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T10:30+02:00"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("START_CHANGED", "PLANNED_LENGTH_CHANGED")));
    }

    @Test
    void manualRecheck_clearsTimingChangeNotice() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);
        putStart(museum, "11:00").andExpect(status().isNoContent());
        putPlannedLength(museum, 60).andExpect(status().isNoContent());

        checkItinerary();
        saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    private long checkedMuseumAt(String start, int minutes) throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, start, minutes, false, "30-90m");
        checkItinerary();
        return museum;
    }

    @ParameterizedTest
    @MethodSource("repeatableTimingEdits")
    void repeatingSameTimingEdit_leavesPushedVisitAndNoticesUnchanged(String field, Object request, String reason)
            throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "30-60m");
        checkItinerary();
        entry(2, "Garden", DAY, 2, "09:45", 30, false, "30m");

        putTiming(museum, field, request).andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost" + ITINERARY))
                .andExpect(content().string(""));
        var afterFirstPut = saved()
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value(DAY + "T10:00+02:00"))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[*].subject", contains("Museum", "Garden")))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains(reason)))
                .andExpect(jsonPath("$.changeNotices[1].reasons", contains("ATTRACTION_ADDED", "START_CHANGED")))
                .andReturn().getResponse().getContentAsString();

        putTiming(museum, field, request).andExpect(status().isNoContent());
        saved().andExpect(content().json(afterFirstPut, JsonCompareMode.STRICT));
    }

    private static Stream<Arguments> repeatableTimingEdits() {
        return Stream.of(
                Arguments.of("start", new UpdateItineraryEntryStartRequest("09:30"), "START_CHANGED"),
                Arguments.of("end", new UpdateItineraryEntryEndRequest(LocalDate.parse(DAY), "10:00"),
                        "PLANNED_LENGTH_CHANGED"),
                Arguments.of("planned-length", new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(60)),
                        "PLANNED_LENGTH_CHANGED")
        );
    }

    @ParameterizedTest
    @MethodSource("malformedTimingRequests")
    void malformedTimingRequest_isRejectedWithoutChangingSavedInterval(String field, Object request, String message)
            throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "30-60m");

        rejected(putTiming(museum, field, request), message);
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T09:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(false));
    }

    private static Stream<Arguments> malformedTimingRequests() {
        var invalidFields = "Request body must contain valid JSON with the expected field types.";
        var invalidLength = "{wholePlannedLength = enter a non-negative whole length in minutes}";
        return Stream.of(
                Arguments.of("start", Map.of(), "{startTime = must not be null}"),
                Arguments.of("start", new UpdateItineraryEntryStartRequest("24:00"),
                        "{startTime = enter a local clock as HH:mm or HH:mm:ss}"),
                Arguments.of("start", Map.of("startTime", "09:30", "plannedMinutes", 30), invalidFields),
                Arguments.of("end", Map.of("endTime", "09:30"), "{endDate = must not be null}"),
                Arguments.of("end", Map.of("endDate", LocalDate.parse(DAY)), "{endTime = must not be null}"),
                Arguments.of("fixed-start", Map.of(), "{fixedStart = must not be null}"),
                Arguments.of("fixed-start", Map.of("fixedStart", true, "startTime", "09:30"), invalidFields),
                Arguments.of("planned-length", Map.of(), "{plannedMinutes = must not be null}"),
                Arguments.of("planned-length",
                        new UpdateItineraryEntryPlannedLengthRequest(new BigDecimal("30.5")), invalidLength),
                Arguments.of("planned-length",
                        new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(-1)), invalidLength),
                Arguments.of("planned-length",
                        new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(2_147_483_648L)), invalidLength)
        );
    }

    private ResultActions putStart(long entryId, String clock) throws Exception {
        return putTiming(entryId, "start", new UpdateItineraryEntryStartRequest(clock));
    }

    private ResultActions putEnd(long entryId, String date, String clock) throws Exception {
        return putTiming(entryId, "end", new UpdateItineraryEntryEndRequest(LocalDate.parse(date), clock));
    }

    private ResultActions putPlannedLength(long entryId, int minutes) throws Exception {
        return putTiming(entryId, "planned-length",
                new UpdateItineraryEntryPlannedLengthRequest(BigDecimal.valueOf(minutes)));
    }

    private ResultActions putFixedStart(long entryId, boolean fixed) throws Exception {
        return putTiming(entryId, "fixed-start", new UpdateItineraryEntryFixedStartRequest(fixed));
    }

    private ResultActions putTiming(long entryId, String field, Object request) throws Exception {
        return mockMvc.perform(put(ITINERARY + "/entries/{entryId}/{field}", entryId, field)
                .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)));
    }

    private static void rejected(ResultActions result, String message) throws Exception {
        result.andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(message));
    }

    private ResultActions saved() throws Exception {
        entityManager.flush();
        entityManager.clear();
        return mockMvc.perform(get(ITINERARY).header("x-api-version", "1")).andExpect(status().isOk());
    }

    private void checkItinerary() throws Exception {
        var itinerary = mapper.readValue(saved().andReturn().getResponse().getContentAsString(), GetItineraryResponse.class);
        var check = new CheckItineraryRequest(itinerary.checkContext());
        mockMvc.perform(post(ITINERARY + "/check").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content(mapper.writeValueAsString(check)))
                .andExpect(status().isNoContent());
    }

    private void seedTrip(String first, String last) {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, 5);
        entityManager.createNativeQuery("""
                UPDATE trip SET trip_start_date = CAST(:first AS date), trip_end_date = CAST(:last AS date) WHERE id = 1;
                INSERT INTO itinerary(trip_id, time_zone) VALUES (1, 'Europe/Belgrade');
                INSERT INTO itinerary_day(trip_id, date)
                SELECT 1, CAST(:first AS date) + day_offset
                FROM generate_series(0, CAST(:last AS date) - CAST(:first AS date)) AS days(day_offset);
                """).setParameter("first", first).setParameter("last", last).executeUpdate();
    }

    private long entry(int attraction, String name, String date, int position, String start,
                       int length, boolean fixed, String sourceDuration) {
        entityManager.createNativeQuery("""
                UPDATE attraction SET name = :name WHERE id = :attraction;
                UPDATE trip_attraction SET visit_time = :source WHERE trip_id = 1 AND attraction_id = :attraction;
                """).setParameter("name", name).setParameter("source", sourceDuration)
                .setParameter("attraction", attraction).executeUpdate();
        return ((Number) entityManager.createNativeQuery("""
                INSERT INTO itinerary_entry(trip_id, date, attraction_id, path_position, zone_id,
                    start_time, planned_minutes, fixed_start)
                VALUES (1, CAST(:date AS date), :attraction, :position, 'Europe/Belgrade', CAST(:start AS time), :length,
                    :fixed) RETURNING id
                """).setParameter("date", date).setParameter("attraction", attraction).setParameter("position", position)
                .setParameter("start", start).setParameter("length", length).setParameter("fixed", fixed)
                .getSingleResult()).longValue();
    }
}
