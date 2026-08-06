import { DateInput } from "../../../../shared/ui/forms/DateInput";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { changeAttractionInfoFrom } from "../../infra/ManagerApi";
import { useAttractionInfoFromFormField } from "../add-attraction/AddAttraction.config";
import { EditAttractionInfoFromDetailsProps } from "./ListAttraction.types";
import { useClasses } from "./EditAttractionInfoFromDetails.styles";

const EditAttractionInfoFromDetails: React.FunctionComponent<
  EditAttractionInfoFromDetailsProps
> = (props) => {
  const classes = useClasses();
  const { formFields, isFormValid } = useAttractionInfoFromFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction info from ${props.infoFrom.source}`}
      text={props.infoFrom.source}
      onUpdateClick={async () => {
        await changeAttractionInfoFrom(
          String(props.attractionId),
          formFields.source.value!,
          formFields.sourceFrom.value?.toISOString() ?? ""
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <div className={classes.fields}>
        <div className={classes.searchField}>
          <SearchText
            {...formFields.source}
            searchBoxClassName={classes.searchBox}
          />
        </div>
        <div className={classes.dateField}>
          <DateInput {...formFields.sourceFrom} className={classes.dateInput} />
        </div>
      </div>
    </EditProperty>
  );
};

export default EditAttractionInfoFromDetails;
