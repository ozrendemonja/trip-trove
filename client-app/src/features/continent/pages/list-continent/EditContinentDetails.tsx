import { InputField } from "../../../../shared/ui/forms/InputField";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeContinentName } from "../../infra/ManagerApi";
import { useContinentFormField } from "../add-continent/AddContinent.config";
import { EditContinentDetailsProps } from "./EditContinentDetails.types";

const EditContinentDetails: React.FunctionComponent<
  EditContinentDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useContinentFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change value for ${props.text}`}
      text={props.text}
      conflictErrorMessage="A continent with this name already exists."
      onUpdateClick={async () => {
        await changeContinentName(props.text, formFields.continentName.value!);
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <InputField {...formFields.continentName} placeholder={props.text} />
    </EditProperty>
  );
};

export default EditContinentDetails;
