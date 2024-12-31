import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { changeCityRegion } from "../../infra/ManagerApi";
import { useCityRegionFormField } from "../add-city/AddCity.config";
import { EditPropertyCityDetailsProps } from "./ListCity.types";

const EditCityRegionDetails: React.FunctionComponent<
  EditPropertyCityDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useCityRegionFormField();
  formFields.regionId.placeholder = props.text;

  return (
    <EditProperty
      editIconAriaLabel={`Change region name from ${props.text}`}
      text={props.text}
      onUpdateClick={async () => {
        await changeCityRegion(
          String(props.cityId),
          formFields.regionId.value!
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <SearchText {...formFields.regionId} />
    </EditProperty>
  );
};

export default EditCityRegionDetails;
