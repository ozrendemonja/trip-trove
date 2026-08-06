import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { changeRegionCountry } from "../../infra/ManagerApi";
import { useRegionCountryFormField } from "../add-region/AddRegion.config";
import { EditRegionDetailsProps } from "./ListRegion.types";

const EditRegionCountryDetails: React.FunctionComponent<
  EditRegionDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useRegionCountryFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change country name from ${props.text}`}
      text={props.text}
      conflictErrorMessage="A region with this name already exists in the selected country."
      onUpdateClick={async () => {
        await changeRegionCountry(
          String(props.regionId),
          formFields.countryId.value!
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <SearchText
        {...formFields.countryId}
        placeholder={props.text}
        suggestionsInFlow
      />
    </EditProperty>
  );
};

export default EditRegionCountryDetails;
