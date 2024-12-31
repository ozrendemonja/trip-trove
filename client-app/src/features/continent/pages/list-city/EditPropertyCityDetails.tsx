import { TextField } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { EditPropertyCityDetailsProps } from "./ListCity.types";
import { changeCityDetails } from "../../infra/ManagerApi";
import { useCityDetailsFormField } from "../add-city/AddCity.config";

const EditPropertyCityDetails: React.FunctionComponent<
  EditPropertyCityDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useCityDetailsFormField();
  formFields.cityName.placeholder = props.text;

  return (
    <EditProperty
      editIconAriaLabel={`Change city name for ${props.text}`}
      text={props.text}
      onUpdateClick={async () => {
        await changeCityDetails(
          String(props.cityId),
          formFields?.cityName.value!
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <TextField {...formFields.cityName} />
    </EditProperty>
  );
};

export default EditPropertyCityDetails;
