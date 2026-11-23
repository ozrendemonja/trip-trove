import { InputField } from "../../shared/ui/forms/InputField";
import { Text } from "@fluentui/react-components";
import React, { useRef, useState } from "react";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import { updateTripName } from "./infra/TripApi";
import { PlanningSaveError, savePlanningChange } from "./infra/PlanningApi";
import { useMyTripListClasses } from "./MyTripList.styles";
import { EditTripDetailsProps } from "./EditTripDetails.types";
import { detectTripChanges } from "./EditTripDetails.utils";
import { Flex } from "../../shared/ui/Flex";
import { getApiErrorCode } from "../../shared/hooks/UseSaveError";

const toDateInputValue = (iso?: string): string =>
  iso ? iso.substring(0, 10) : "";

const EditTripDetails: React.FunctionComponent<EditTripDetailsProps> = (
  props
) => {
  const classes = useMyTripListClasses();
  const [name, setName] = useState(props.trip.name);
  const [startDate, setStartDate] = useState(
    toDateInputValue(props.trip.startDate)
  );
  const [endDate, setEndDate] = useState(toDateInputValue(props.trip.endDate));
  const [saving, setSaving] = useState(false);
  const savedTrip = useRef(props.trip);

  return (
    <EditProperty
      text="Trip"
      title={`Edit ${props.trip.name}`}
      editIconAriaLabel={`Edit trip ${props.trip.name}`}
      isOpen={props.isOpen}
      onDismiss={props.onDismiss}
      conflictErrorMessage="A trip with this name already exists in the selected date range."
      saveErrorMessage={(error) =>
        error instanceof PlanningSaveError &&
        getApiErrorCode(error) === "RESOURCE_HAS_DEPENDENCIES"
          ? error.message
          : "The save couldn't be completed. Your details are still here; review them and try again."
      }
      isFormValid={!!name.trim() && !!startDate && !!endDate}
      pending={saving}
      onUpdateClick={async () => {
        setSaving(true);
        try {
          const changes = detectTripChanges(
            savedTrip.current,
            name,
            startDate,
            endDate
          );
          if (changes.nameChanged) {
            await updateTripName(props.trip.id, name.trim());
            savedTrip.current = { ...savedTrip.current, name: name.trim() };
          }
          if (changes.datesChanged) {
            await savePlanningChange(props.trip.id, {
              type: "dates",
              fromDate: startDate,
              toDate: endDate
            });
            savedTrip.current = {
              ...savedTrip.current,
              startDate,
              endDate
            };
          }
          props.onUpdateClick();
        } finally {
          setSaving(false);
        }
      }}
    >
      <Flex gap={16}>
        <InputField
          label="Trip name"
          value={name}
          disabled={saving}
          onChange={(_e, val) => setName(val ?? "")}
        />
        <Flex direction="row" align="flex-end" gap={8}>
          <InputField
            label="Start date"
            type="date"
            value={startDate}
            disabled={saving}
            onChange={(_e, val) => setStartDate(val ?? "")}
            className={classes.dateField}
          />
          <Text className={classes.dateArrow}>{"\u2192"}</Text>
          <InputField
            label="End date"
            type="date"
            value={endDate}
            disabled={saving}
            onChange={(_e, val) => setEndDate(val ?? "")}
            className={classes.dateField}
          />
        </Flex>
      </Flex>
    </EditProperty>
  );
};

export default EditTripDetails;
