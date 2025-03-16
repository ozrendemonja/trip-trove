import { Stack, TextField, Toggle } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { changeAttractionDetails } from "../../infra/ManagerApi";
import { useAttractionDetailsFormField } from "../add-attraction/AddAttraction.config";
import { EditPropertyAttractionDetailsProps } from "./ListAttraction.types";

const EditPropertyAttractionDetails: React.FunctionComponent<
  EditPropertyAttractionDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useAttractionDetailsFormField();
  const [isPartOfAttraction, { toggle: togglePartOfAttraction }] =
    useBoolean(false);

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction details from ${props.text}`}
      text={props.text}
      onUpdateClick={async () => {
        await changeAttractionDetails(
          String(props.attractionId),
          formFields.name.value!,
          formFields.mainAttractionId?.value
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <Stack tokens={{ childrenGap: 48 }} horizontal={true}>
        <TextField
          {...formFields.name}
          // className={classes.attractionName}
        />
        <Toggle
          //   className={classes.inputToggle}
          styles={{ root: { marginBottom: "-2.8%" } }}
          label="Part of attraction"
          inlineLabel
          onChange={togglePartOfAttraction}
        />
      </Stack>
      {isPartOfAttraction && (
        <SearchText
          {...formFields.mainAttractionId}
          //   className={searchOverride}
        />
      )}
    </EditProperty>
  );
};

export default EditPropertyAttractionDetails;
