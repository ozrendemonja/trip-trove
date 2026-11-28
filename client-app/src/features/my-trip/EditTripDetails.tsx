import { InputField } from "../../shared/ui/forms/InputField";
import { MessageBar, MessageBarBody, Text } from "@fluentui/react-components";
import React, { useState } from "react";
import { useBeforeUnload } from "react-router";
import type {
  TripRangeImpactResponse,
  UpdateTripRangeRequest
} from "../../clients/manager";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import {
  fetchTripById,
  loadTripRangeImpact,
  updateTripName
} from "./infra/TripApi";
import {
  PLANNING_REQUEST_TIMEOUT_MS,
  PlanningSaveError,
  savePlanningChange
} from "./infra/PlanningApi";
import { useMyTripListClasses } from "./MyTripList.styles";
import { EditTripDetailsProps } from "./EditTripDetails.types";
import { detectTripChanges, mapEmptyDates } from "./EditTripDetails.utils";
import { Flex } from "../../shared/ui/Flex";
import { getApiErrorCode } from "../../shared/hooks/UseSaveError";
import type { Trip } from "./domain/Trip.types";
import { formatItineraryDate } from "./itineraryDateLabel";

const toDateInputValue = (iso?: string): string =>
  iso ? iso.substring(0, 10) : "";

const formatRange = (from: string, to: string): string =>
  from === to
    ? formatItineraryDate(from)
    : `${formatItineraryDate(from)} to ${formatItineraryDate(to)}`;

const formatDateRuns = (dates: string[]): string => {
  let from = dates[0];
  if (!from) return "None";
  let to = from;
  const runs: string[] = [];
  for (const date of dates.slice(1)) {
    if (Date.parse(date) - Date.parse(to) !== 86_400_000) {
      runs.push(formatRange(from, to));
      from = date;
    }
    to = date;
  }
  runs.push(formatRange(from, to));
  return runs.join("; ");
};

const blockerLabels = {
  DAY_NOTE: "Day note",
  ENTRY: "Entry",
  OVERNIGHT_ENTRY: "Overnight entry"
} satisfies Record<TripRangeImpactResponse["blockers"][number]["kind"], string>;

const MapTheDays = ({
  impact,
  proposed
}: {
  impact: TripRangeImpactResponse;
  proposed: UpdateTripRangeRequest;
}): React.ReactElement => {
  const emptyDates = mapEmptyDates(impact, proposed);
  return (
    <Flex gap={8}>
      <Text as="h3" weight="semibold">
        Map the days
      </Text>
      <Text>
        <Text weight="semibold">Current:</Text>{" "}
        {formatRange(impact.currentFromDate, impact.currentToDate)}
      </Text>
      <Text>
        <Text weight="semibold">Proposed:</Text>{" "}
        {formatRange(proposed.fromDate, proposed.toDate)}
      </Text>
      <Text>
        <Text weight="semibold">Added empty dates:</Text>{" "}
        {formatDateRuns(emptyDates.added)}
      </Text>
      <Text>
        <Text weight="semibold">Removed empty dates:</Text>{" "}
        {formatDateRuns(emptyDates.removed)}
      </Text>
      {impact.blockers.length > 0 && (
        <MessageBar intent="warning">
          <MessageBarBody>
            {impact.shiftBlocked
              ? "Shifting dates is only available for an empty itinerary."
              : "Keep these dates or move or remove their content first."}
            <ul>
              {impact.blockers.map(({ date, kind, content }) => (
                <li key={`${date}:${kind}:${content}`}>
                  {formatItineraryDate(date)}: {blockerLabels[kind]}: {content}
                </li>
              ))}
            </ul>
          </MessageBarBody>
        </MessageBar>
      )}
      <Text>
        {
          "Bookings won't change. Check the itinerary again manually after changing the dates."
        }
      </Text>
    </Flex>
  );
};

type DateReview =
  | { step: "edit" }
  | {
      step: "confirm";
      proposed: UpdateTripRangeRequest;
      impact: TripRangeImpactResponse;
    }
  | { step: "reload"; attempted: UpdateTripRangeRequest }
  | { step: "inspect"; trip: Trip; applied: boolean };

const EditTripDetails: React.FunctionComponent<EditTripDetailsProps> = (
  props
) => {
  const classes = useMyTripListClasses();
  const [name, setName] = useState(props.trip.name);
  const [startDate, setStartDate] = useState(
    props.unconfirmedDates?.fromDate ?? toDateInputValue(props.trip.startDate)
  );
  const [endDate, setEndDate] = useState(
    props.unconfirmedDates?.toDate ?? toDateInputValue(props.trip.endDate)
  );
  const [saving, setSaving] = useState(false);
  const [savedTrip, setSavedTrip] = useState(props.trip);
  const [dateReview, setDateReview] = useState<DateReview>(
    props.unconfirmedDates
      ? { step: "reload", attempted: props.unconfirmedDates }
      : { step: "edit" }
  );
  const changes = detectTripChanges(savedTrip, name, startDate, endDate);
  const impact = dateReview.step === "confirm" ? dateReview.impact : undefined;
  const needsInspection =
    dateReview.step === "reload" || dateReview.step === "inspect";
  const hasBothDates = !!startDate && !!endDate;
  const action =
    dateReview.step === "edit" && changes.datesChanged && hasBothDates
      ? "preview"
      : dateReview.step;
  const [submitText, pendingSubmitText] = {
    edit: ["Update", "Updating..."],
    preview: ["Review dates", "Mapping the days..."],
    confirm: ["Confirm dates", "Updating..."],
    reload: ["Reload saved dates", "Loading saved dates..."],
    inspect: [
      dateReview.step === "inspect" && dateReview.applied
        ? "Done"
        : "Continue editing",
      "Updating..."
    ]
  }[action];

  useBeforeUnload((event) => {
    if (
      props.isOpen &&
      (saving || needsInspection || changes.nameChanged || changes.datesChanged)
    ) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  return (
    <EditProperty
      text="Trip"
      title={`Edit ${props.trip.name}`}
      editIconAriaLabel={`Edit trip ${props.trip.name}`}
      isOpen={props.isOpen}
      onDismiss={props.onDismiss}
      conflictErrorMessage="A trip with this name already exists in the selected date range."
      saveErrorMessage={(error) => {
        if (action === "reload") {
          return "The saved dates couldn't be loaded. Try reloading again.";
        }
        if (action === "preview" && error instanceof Error)
          return error.message;
        if (
          error instanceof PlanningSaveError &&
          getApiErrorCode(error) === "RESOURCE_HAS_DEPENDENCIES"
        ) {
          return error.message;
        }
        return "The save couldn't be completed. Your details are still here; review them and try again.";
      }}
      isFormValid={
        needsInspection ||
        (!!name.trim() &&
          hasBothDates &&
          !impact?.shiftBlocked &&
          !impact?.blockers.length)
      }
      submitText={submitText}
      pendingSubmitText={pendingSubmitText}
      pending={saving}
      onUpdateClick={async () => {
        setSaving(true);
        try {
          if (dateReview.step === "reload") {
            const trip = await fetchTripById(props.trip.id, {
              cache: "no-store",
              signal: AbortSignal.timeout(PLANNING_REQUEST_TIMEOUT_MS)
            });
            if (!trip.startDate || !trip.endDate) {
              throw new Error("The server returned incomplete saved dates.");
            }
            const applied =
              toDateInputValue(trip.startDate) ===
                dateReview.attempted.fromDate &&
              toDateInputValue(trip.endDate) === dateReview.attempted.toDate;
            setDateReview({ step: "inspect", trip, applied });
            return false;
          }
          if (dateReview.step === "inspect") {
            props.onDateSaveStateChange?.();
            props.onSavedDatesInspected?.(dateReview.trip);
            if (dateReview.applied) {
              props.onUpdateClick();
              return true;
            }
            setSavedTrip(dateReview.trip);
            setName(dateReview.trip.name);
            setDateReview({ step: "edit" });
            return false;
          }
          if (action === "preview") {
            const proposed = { fromDate: startDate, toDate: endDate };
            const mapped = await loadTripRangeImpact(props.trip.id, proposed);
            setDateReview({ step: "confirm", proposed, impact: mapped });
            return false;
          }
          if (changes.nameChanged) {
            await updateTripName(props.trip.id, name.trim());
            setSavedTrip({ ...savedTrip, name: name.trim() });
          }
          if (
            dateReview.step === "confirm" &&
            (dateReview.proposed.fromDate !==
              dateReview.impact.currentFromDate ||
              dateReview.proposed.toDate !== dateReview.impact.currentToDate)
          ) {
            const reviewedRange = dateReview.proposed;
            props.onDateSaveStateChange?.(reviewedRange);
            try {
              await savePlanningChange(
                props.trip.id,
                { type: "dates", ...reviewedRange },
                AbortSignal.timeout(PLANNING_REQUEST_TIMEOUT_MS)
              );
              props.onDateSaveStateChange?.();
            } catch (error) {
              if (error instanceof PlanningSaveError && !error.unconfirmed) {
                setDateReview({ step: "edit" });
                props.onDateSaveStateChange?.();
                throw error;
              }
              setDateReview({ step: "reload", attempted: reviewedRange });
              return false;
            }
          }
          props.onUpdateClick();
          return true;
        } finally {
          setSaving(false);
        }
      }}
    >
      <Flex gap={16}>
        <InputField
          label="Trip name"
          value={name}
          disabled={saving || needsInspection}
          onChange={(_e, val) => setName(val ?? "")}
        />
        <Flex direction="row" align="flex-end" gap={8}>
          <InputField
            label="Start date"
            type="date"
            value={startDate}
            disabled={saving || needsInspection}
            onChange={(_e, val) => {
              setStartDate(val ?? "");
              setDateReview({ step: "edit" });
            }}
            className={classes.dateField}
          />
          <Text className={classes.dateArrow}>{"\u2192"}</Text>
          <InputField
            label="End date"
            type="date"
            value={endDate}
            disabled={saving || needsInspection}
            onChange={(_e, val) => {
              setEndDate(val ?? "");
              setDateReview({ step: "edit" });
            }}
            className={classes.dateField}
          />
        </Flex>
        {dateReview.step === "confirm" && (
          <MapTheDays
            impact={dateReview.impact}
            proposed={dateReview.proposed}
          />
        )}
        {needsInspection && (
          <MessageBar
            intent={dateReview.step === "inspect" ? "info" : "warning"}
          >
            <MessageBarBody>
              {dateReview.step === "inspect" ? (
                <>
                  <Text weight="semibold">Saved dates:</Text>{" "}
                  {formatRange(
                    toDateInputValue(dateReview.trip.startDate),
                    toDateInputValue(dateReview.trip.endDate)
                  )}
                  .{" "}
                  {dateReview.applied
                    ? "The proposed dates are saved."
                    : "The proposed dates are not saved. Review the saved dates before preparing a new change."}
                </>
              ) : (
                "The date save couldn't be confirmed. Reload and inspect the saved dates before trying again."
              )}
            </MessageBarBody>
          </MessageBar>
        )}
      </Flex>
    </EditProperty>
  );
};

export default EditTripDetails;
