import { InputField } from "../../shared/ui/forms/InputField";
import { Text } from "@fluentui/react-components";
import React, { useState } from "react";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import { updateTripDates, updateTripName } from "./infra/TripApi";
import { useMyTripListClasses } from "./MyTripList.styles";
import { EditTripDetailsProps } from "./EditTripDetails.types";
import { detectTripChanges } from "./EditTripDetails.utils";
import { Flex } from "../../shared/ui/Flex";

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

  const isFormValid = !!name.trim() && !!startDate && !!endDate;

  return (
    <EditProperty
      text="Trip"
      title={`Edit ${props.trip.name}`}
      editIconAriaLabel={`Edit trip ${props.trip.name}`}
      isOpen={props.isOpen}
      onDismiss={props.onDismiss}
      conflictErrorMessage="A trip with this name already exists in the selected date range."
      isFormValid={isFormValid}
      onUpdateClick={async () => {
        const changes = detectTripChanges(props.trip, name, startDate, endDate);
        if (changes.nameChanged) {
          await updateTripName(props.trip.id, name.trim());
        }
        if (changes.datesChanged) {
          await updateTripDates(props.trip.id, startDate, endDate);
        }
        props.onUpdateClick();
      }}
    >
      <Flex gap={16}>
        <InputField
          label="Trip name"
          value={name}
          onChange={(_e, val) => setName(val ?? "")}
        />
        <Flex direction="row" align="flex-end" gap={8}>
          <InputField
            label="Start date"
            type="date"
            value={startDate}
            onChange={(_e, val) => setStartDate(val ?? "")}
            className={classes.dateField}
          />
          <Text className={classes.dateArrow}>{"\u2192"}</Text>
          <InputField
            label="End date"
            type="date"
            value={endDate}
            onChange={(_e, val) => setEndDate(val ?? "")}
            className={classes.dateField}
          />
        </Flex>
      </Flex>
    </EditProperty>
  );
};

export default EditTripDetails;
