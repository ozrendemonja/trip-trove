import { TextField } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeContinentName } from "../../infra/ManagerApi";
import { useContinentFormField } from "../add-continent/AddContinent.config";
import { EditContinentDetailsProps } from "./EditContinentDetails.types";

const EditContinentDetails: React.FunctionComponent<
  EditContinentDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useContinentFormField();
  formFields.continentName.placeholder = props.text;

  return (
    <EditProperty
      editIconAriaLabel={`Change value for ${props.text}`}
      text={props.text}
      onUpdateClick={async () => {
        await changeContinentName(props.text, formFields.continentName.value!);
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <TextField {...formFields.continentName} />
    </EditProperty>
  );
};

export default EditContinentDetails;
