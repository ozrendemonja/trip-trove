import { DatePicker, Stack, Text, TextField } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeAttractionInfoFrom } from "../../infra/ManagerApi";
import { useAttractionInfoFromFormField } from "../add-attraction/AddAttraction.config";
import { EditAttractionInfoFromDetailsProps } from "./ListAttraction.types";

const EditAttractionInfoFromDetails: React.FunctionComponent<
  EditAttractionInfoFromDetailsProps
> = (props) => {
  const { formFields, isFormValid } = useAttractionInfoFromFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction info from ${props.infoFrom.source}`}
      text={props.infoFrom.source}
      onUpdateClick={async () => {
        await changeAttractionInfoFrom(
          String(props.attractionId),
          formFields.source.value!,
          formFields.sourceFrom.value?.toISOString()!
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <Stack
        tokens={{ childrenGap: 48 }}
        horizontal={true}
        // className={classes.tip}
      >
        <TextField {...formFields.source} />
        <Stack>
          <Text
            as="label"
            // className={classes.checkbox}
          >
            When information comes from?
          </Text>
          <DatePicker {...formFields.sourceFrom} />
        </Stack>
      </Stack>
    </EditProperty>
  );
};

export default EditAttractionInfoFromDetails;
