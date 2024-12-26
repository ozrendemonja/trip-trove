import { TextField } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeCountryDetails } from "../../infra/ManagerApi";
import { useCountryDetailsFormField } from "../add-country/AddCountry.config";
import { EditCountryDetailsProps } from "./ListCountry.types";

const EditPropertyCountryDetails: React.FunctionComponent<
  EditCountryDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useCountryDetailsFormField();
  formFields.countryName.placeholder = props.text;

  return (
    <EditProperty
      editIconAriaLabel={`Change country name for ${props.text}`}
      text={props.text}
      onUpdateClick={async () => {
        await changeCountryDetails(
          String(props.countryId),
          formFields.countryName.value!
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <TextField {...formFields.countryName} />
    </EditProperty>
  );
};

export default EditPropertyCountryDetails;
