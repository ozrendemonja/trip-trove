import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import {
  CheckboxChecked24Filled,
  CheckboxUnchecked24Regular
} from "@fluentui/react-icons";
import { makeStyles, tokens } from "@fluentui/react-components";
import { changeAttractionTraditional } from "../../infra/ManagerApi";
import { EditAttractionTraditionalProps } from "./ListAttraction.types";

const useStyles = makeStyles({
  selectedIndicator: {
    color: tokens.colorBrandBackground
  },
  unselectedIndicator: {
    color: tokens.colorNeutralForeground3
  }
});

const EditAttractionTraditional: React.FunctionComponent<
  EditAttractionTraditionalProps
> = (props) => {
  const classes = useStyles();

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
