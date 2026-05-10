import { ComboBox } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeCountryIsoCode } from "../../infra/ManagerApi";
import { useCountryIsoCodeFormField } from "../add-country/AddCountry.config";
import { EditCountryDetailsProps } from "./ListCountry.types";

const EditPropertyCountryIsoCode: React.FunctionComponent<
  EditCountryDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useCountryIsoCodeFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change ISO code for ${props.text}`}
      text={props.text}
      onUpdateClick={async () => {
        await changeCountryIsoCode(
          String(props.countryId),
          formFields.isoCode!.value
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <ComboBox {...formFields.isoCode!} />
    </EditProperty>
  );
};

export default EditPropertyCountryIsoCode;
