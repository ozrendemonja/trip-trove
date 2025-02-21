import { Stack, Text, Toggle } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { useAttractionDestinationFormField } from "../add-attraction/AddAttraction.config";
import { EditAttractionDestinationProps } from "./ListAttraction.types";
import { changeAttractionDestination } from "../../infra/ManagerApi";

const EditAttractionDestination: React.FunctionComponent<
  EditAttractionDestinationProps
> = (props) => {
  const { formFields, isFormValid } = useAttractionDestinationFormField();
  const [isCountrywide, { toggle: toggleIsCountrywide }] = useBoolean(
    props.destination.isCountrywide
  );
  const [isReginal, { toggle: toggleReginal }] = useBoolean(
    props.destination.regionName != undefined
  );

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction destination from ${props.destination.countryName}`}
      text={props.destination.countryName}
      onUpdateClick={async () => {
        await changeAttractionDestination(
          String(props.attractionId),
          isCountrywide,
          formFields.regionId?.value,
          formFields.cityId?.value
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <Stack tokens={{ childrenGap: 48 }} horizontal={true}>
        <Text
          as="h1"
          // className={classes.subHeader}
        >
          Country
        </Text>
        <Toggle
          //   className={classes.checkbox}
          label="Nationally Recognized Attraction"
          inlineLabel
          onChange={toggleIsCountrywide}
        />
      </Stack>
      <SearchText {...formFields.countryId} />
      <Stack tokens={{ childrenGap: 48 }} horizontal={true}>
        <Text
          as="h2"
          // className={classes.subHeader}
        >
          {isReginal ? "Region" : "City"}
        </Text>
        <Toggle
          //   className={classes.checkbox}
          label="Attraction is region level"
          inlineLabel
          onChange={toggleReginal}
        />
      </Stack>
      {isReginal && <SearchText {...formFields.regionId} />}
      {!isReginal && <SearchText {...formFields.cityId} />}
    </EditProperty>
  );
};

export default EditAttractionDestination;
