import { Divider, Switch, Text } from "@fluentui/react-components";
import { useBooleanState } from "../../../../shared/hooks/useBooleanState";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { useAttractionDestinationFormField } from "../add-attraction/AddAttraction.config";
import { EditAttractionDestinationProps } from "./ListAttraction.types";
import { changeAttractionDestination } from "../../infra/ManagerApi";
import { Flex } from "../../../../shared/ui/Flex";
import { useClasses } from "./EditAttractionDestination.styles";

const EditAttractionDestination: React.FunctionComponent<
  EditAttractionDestinationProps
> = (props) => {
  const classes = useClasses();
  const { formFields, isFormValid } = useAttractionDestinationFormField();
  const [isCountrywide, { toggle: toggleIsCountrywide }] = useBooleanState(
    props.destination.isCountrywide
  );
  const [isReginal, { toggle: toggleReginal }] = useBooleanState(true);

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction destination from ${props.destination.countryName}`}
      text={props.destination.countryName}
      conflictErrorMessage="An attraction with this name already exists at the selected destination."
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
      <Divider />
      <Flex gap={36} direction="row">
        <Text
          as="h2"
          style={{ textAlign: "end", fontSize: "20px" }}
          // className={classes.subHeader}
        >
          Country
        </Text>
        <Switch
          //   className={classes.checkbox}
          label="Nationally Recognized Attraction"
          onChange={toggleIsCountrywide}
          checked={isCountrywide}
          style={{ marginBottom: 0, fontSize: "14px" }}
        />
      </Flex>
      <div className={classes.searchField}>
        <SearchText
          {...formFields.countryId}
          searchBoxClassName={classes.searchBox}
        />
      </div>
      <Divider />
      <Flex gap={36} direction="row">
        <Text
          as="h2"
          style={{ textAlign: "end", fontSize: "20px" }}
          // className={classes.subHeader}
        >
          {isReginal ? "Region" : "City"}
        </Text>
        <Switch
          //   className={classes.checkbox}
          label="Attraction is region level"
          onChange={toggleReginal}
          checked={isReginal}
          style={{ marginBottom: 0, fontSize: "14px" }}
        />
      </Flex>
      <div className={classes.searchField}>
        {isReginal && (
          <SearchText
            {...formFields.regionId}
            searchBoxClassName={classes.searchBox}
          />
        )}
        {!isReginal && (
          <SearchText
            {...formFields.cityId}
            searchBoxClassName={classes.searchBox}
          />
        )}
      </div>
    </EditProperty>
  );
};

export default EditAttractionDestination;
