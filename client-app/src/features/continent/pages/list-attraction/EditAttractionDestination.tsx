import { Separator, Stack, Text, Toggle } from "@fluentui/react";
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
  const [isReginal, { toggle: toggleReginal }] = useBoolean(true);

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
      <Separator></Separator>
      <Stack tokens={{ childrenGap: 36 }} horizontal={true}>
        <Text
          as="h2"
          styles={{ root: { textAlign: "end", fontSize: "20px" } }}
          // className={classes.subHeader}
        >
          Country
        </Text>
        <Toggle
          //   className={classes.checkbox}
          label="Nationally Recognized Attraction"
          inlineLabel
          onChange={toggleIsCountrywide}
          styles={{
            root: { textAlign: "end", marginBottom: 0, fontSize: "14px" }
          }}
        />
      </Stack>
      <SearchText {...formFields.countryId} />
      <Separator></Separator>
      <Stack tokens={{ childrenGap: 36 }} horizontal={true}>
        <Text
          as="h2"
          styles={{ root: { textAlign: "end", fontSize: "20px" } }}
          // className={classes.subHeader}
        >
          {isReginal ? "Region" : "City"}
        </Text>
        <Toggle
          //   className={classes.checkbox}
          label="Attraction is region level"
          inlineLabel
          defaultChecked={isReginal}
          onChange={toggleReginal}
          styles={{
            root: { textAlign: "end", marginBottom: 0, fontSize: "14px" }
          }}
        />
      </Stack>
      {isReginal && <SearchText {...formFields.regionId} />}
      {!isReginal && <SearchText {...formFields.cityId} />}
    </EditProperty>
  );
};

export default EditAttractionDestination;
