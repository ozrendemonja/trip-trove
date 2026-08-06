import { InputField } from "../../../../shared/ui/forms/InputField";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeCountryDetails } from "../../infra/ManagerApi";
import { useCountryDetailsFormField } from "../add-country/AddCountry.config";
import { EditCountryDetailsProps } from "./ListCountry.types";

const EditPropertyCountryDetails: React.FunctionComponent<
  EditCountryDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useCountryDetailsFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change country name for ${props.text}`}
      text={props.text}
      conflictErrorMessage="A country with this name already exists in this continent."
      onUpdateClick={async () => {
        await changeCountryDetails(
          String(props.countryId),
          formFields.countryName.value!
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <InputField {...formFields.countryName} placeholder={props.text} />
    </EditProperty>
  );
};

export default EditPropertyCountryDetails;
