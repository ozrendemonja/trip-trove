import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { Star24Filled, StarAdd24Regular } from "@fluentui/react-icons";
import { changeAttractionMustVisit } from "../../infra/ManagerApi";
import { EditAttractionMustVisitProps } from "./ListAttraction.types";

const EditAttractionMustVisit: React.FunctionComponent<
  EditAttractionMustVisitProps
> = (props) => {
  return (
    <EditProperty
      editIcon={props?.mustVisit ? <Star24Filled /> : <StarAdd24Regular />}
      // styles: { root: { color: "#fec703", fontSize: 20 } }
      editIconAriaLabel={`Change attraction visit preferences for ${props.attractionName} ${props.mustVisit ? "to optional visit" : "to must visit"}`}
      text={props.mustVisit ? "to optional visit" : "to must visit"}
      onUpdateClick={async () => {
        await changeAttractionMustVisit(
          String(props.attractionId),
          !props.mustVisit
        );
        props.onUpdateClick();
      }}
      isFormValid={true}
    ></EditProperty>
  );
};

export default EditAttractionMustVisit;
