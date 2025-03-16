import { Dropdown } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { CategoryType } from "../../domain/Attraction.types";
import { changeAttractionCategory } from "../../infra/ManagerApi";
import { useAttractionCategoryFormField } from "../add-attraction/AddAttraction.config";
import { EditAttractionCategoryProps } from "./ListAttraction.types";

const categoryOptions = Object.values(CategoryType)
  .filter((x) => typeof x !== "number")
  .map((category) => ({
    key: category,
    text: category
  }));

const EditAttractionCategory: React.FunctionComponent<
  EditAttractionCategoryProps
> = (props) => {
  const { formFields, _isFormValid } = useAttractionCategoryFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction category from ${props.category}`}
      text={props.category}
      onUpdateClick={async () => {
        await changeAttractionCategory(
          String(props.attractionId),
          formFields.category.value as unknown as string
        );
        props.onUpdateClick();
      }}
      isFormValid={formFields.category.value != undefined}
    >
      <Dropdown
        {...formFields.category}
        options={categoryOptions}
        styles={{ root: { width: "300px" } }}
        // className={classes.dropdowns}
      />
    </EditProperty>
  );
};

export default EditAttractionCategory;
