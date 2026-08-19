import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import {
  CheckboxChecked24Filled,
  CheckboxUnchecked24Regular
} from "@fluentui/react-icons";
import { changeAttractionTraditional } from "../../infra/ManagerApi";
import { useEditAttractionTraditionalStyles } from "./EditAttractionTraditional.styles";
import { EditAttractionTraditionalProps } from "./ListAttraction.types";

const EditAttractionTraditional: React.FunctionComponent<
  EditAttractionTraditionalProps
> = (props) => {
  const classes = useEditAttractionTraditionalStyles();

  return (
    <EditProperty
      editIcon={
        props?.isTraditional ? (
          <CheckboxChecked24Filled className={classes.selectedIndicator} />
        ) : (
          <CheckboxUnchecked24Regular className={classes.unselectedIndicator} />
        )
      }
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
