import { TextField } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeAttractionTip } from "../../infra/ManagerApi";
import { useAttractionTipFormField } from "../add-attraction/AddAttraction.config";
import { EditAttractionTipProps } from "./ListAttraction.types";

const EditAttractionTip: React.FunctionComponent<EditAttractionTipProps> = (
  props
) => {
  const { formFields, isFormValid } = useAttractionTipFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction tip for ${props.attractionName}`}
      text={"Attraction tip"}
      onUpdateClick={async () => {
        await changeAttractionTip(
          String(props.attractionId),
          formFields.tip?.value
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <TextField
        {...formFields.tip}
        // className={classes.tip}
      />
    </EditProperty>
  );
};

export default EditAttractionTip;
