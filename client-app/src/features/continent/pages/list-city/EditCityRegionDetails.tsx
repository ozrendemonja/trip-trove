import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { changeCityRegion } from "../../infra/ManagerApi";
import { useCityRegionFormField } from "../add-city/AddCity.config";
import { EditPropertyCityDetailsProps } from "./ListCity.types";

const EditCityRegionDetails: React.FunctionComponent<
  EditPropertyCityDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useCityRegionFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change region name from ${props.text}`}
      text={props.text}
      conflictErrorMessage="A city with this name already exists in the selected region."
      onUpdateClick={async () => {
        await changeCityRegion(
          String(props.cityId),
          formFields.regionId.value!
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <SearchText
        {...formFields.regionId}
        placeholder={props.text}
        suggestionsInFlow
      />
    </EditProperty>
  );
};

export default EditCityRegionDetails;
