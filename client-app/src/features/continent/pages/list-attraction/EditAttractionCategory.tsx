import { SelectField } from "../../../../shared/ui/forms/SelectField";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { CategoryType } from "../../domain/Attraction.types";
import { changeAttractionCategory } from "../../infra/ManagerApi";
import { useAttractionCategoryFormField } from "../add-attraction/AddAttraction.config";
import { useEditAttractionCategoryStyles } from "./EditAttractionCategory.styles";
import { EditAttractionCategoryProps } from "./ListAttraction.types";

const categoryOptions = Object.values(CategoryType)
  .filter((x) => typeof x !== "number")
  .map((category) => ({
    value: category,
    label: category
  }));

const EditAttractionCategory: React.FunctionComponent<
  EditAttractionCategoryProps
> = (props) => {
  const classes = useEditAttractionCategoryStyles();
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
      <SelectField
        {...formFields.category}
        choices={categoryOptions}
        className={classes.select}
      />
    </EditProperty>
  );
};

export default EditAttractionCategory;
