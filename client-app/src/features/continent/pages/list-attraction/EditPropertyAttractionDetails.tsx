import { Switch } from "@fluentui/react-components";
import { InputField } from "../../../../shared/ui/forms/InputField";
import { useBooleanState } from "../../../../shared/hooks/useBooleanState";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { changeAttractionDetails } from "../../infra/ManagerApi";
import { useAttractionDetailsFormField } from "../add-attraction/AddAttraction.config";
import { EditPropertyAttractionDetailsProps } from "./ListAttraction.types";
import { useClasses } from "./EditPropertyAttractionDetails.styles";

const EditPropertyAttractionDetails: React.FunctionComponent<
  EditPropertyAttractionDetailsProps
> = (props) => {
  const classes = useClasses();
  const { formFields, isFormValid } = useAttractionDetailsFormField();
  const [isPartOfAttraction, { toggle: togglePartOfAttraction }] =
    useBooleanState(false);

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction details from ${props.text}`}
      text={props.text}
      conflictErrorMessage="An attraction with this name already exists at this destination."
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
      <div className={classes.fields}>
        <div className={classes.nameField}>
          <InputField {...formFields.name} className={classes.attractionName} />
        </div>
        <Switch
          className={classes.inputToggle}
          label="Part of attraction"
          checked={isPartOfAttraction}
          onChange={togglePartOfAttraction}
        />
      </div>
      {isPartOfAttraction && (
        <div className={classes.mainAttractionField}>
          <SearchText
            {...formFields.mainAttractionId}
            searchBoxClassName={classes.searchBox}
          />
        </div>
      )}
    </EditProperty>
  );
};

export default EditPropertyAttractionDetails;
