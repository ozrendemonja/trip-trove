import { TextField } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeRegionDetails } from "../../infra/ManagerApi";
import { useRegionDetailsFormField } from "../add-region/AddRegion.config";
import { EditRegionDetailsProps } from "./ListRegion.types";

const EditPropertyRegionDetails: React.FunctionComponent<
  EditRegionDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useRegionDetailsFormField();
  formFields.regionName.placeholder = props.text;

  return (
    <EditProperty
      editIconAriaLabel={`Change region name from ${props.text}`}
      text={props.text}
      onUpdateClick={async () => {
        await changeRegionDetails(
          String(props.regionId),
          formFields.regionName.value!
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <TextField {...formFields.regionName} />
    </EditProperty>
  );
};

export default EditPropertyRegionDetails;
