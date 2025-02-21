import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeAttractionTraditional } from "../../infra/ManagerApi";
import { EditAttractionTraditionalProps } from "./ListAttraction.types";

const EditAttractionTraditional: React.FunctionComponent<
  EditAttractionTraditionalProps
> = (props) => {
  return (
    <EditProperty
      editIconName={props?.isTraditional ? "CheckboxComposite" : "Checkbox"}
      // styles: { root: { color: "#fec703", fontSize: 20 } }
      editIconAriaLabel={`Change attraction traditional preferences for ${props.attractionName} ${props.isTraditional ? "to non traditional" : "to traditional"}`}
      text={props.isTraditional ? "to non traditional" : "to traditional"}
      onUpdateClick={async () => {
        await changeAttractionTraditional(
          String(props.attractionId),
          !props.isTraditional
        );
        props.onUpdateClick();
      }}
      isFormValid={true}
    ></EditProperty>
  );
};

export default EditAttractionTraditional;
