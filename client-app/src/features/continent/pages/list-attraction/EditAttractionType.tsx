import { Dropdown } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { EditAttractionTypeProps } from "./ListAttraction.types";
import { AttractionType } from "../../domain/Attraction.types";
import { useAttractionTypeFormField } from "../add-attraction/AddAttraction.config";
import { changeAttractionType } from "../../infra/ManagerApi";

const typeOptions = Object.values(AttractionType)
  .filter((x) => typeof x !== "number")
  .map((category) => ({
    key: category,
    text: category
  }));

const EditAttractionType: React.FunctionComponent<EditAttractionTypeProps> = (
  props
) => {
  const { formFields, isFormValid } = useAttractionTypeFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction type from ${props.type}`}
      text={props.type}
      onUpdateClick={async () => {
        await changeAttractionType(
          String(props.attractionId),
          formFields.type.value as unknown as string
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <Dropdown
        {...formFields.type}
        options={typeOptions}
        // className={classes.dropdowns}
      />
    </EditProperty>
  );
};

export default EditAttractionType;
