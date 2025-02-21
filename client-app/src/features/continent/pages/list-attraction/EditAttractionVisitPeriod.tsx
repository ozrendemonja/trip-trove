import { Stack, Text } from "@fluentui/react";
import DateRangePicker from "../../../../shared/list-element/ui/date-picker/DateRangePicker";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeAttractionVisitPeriod } from "../../infra/ManagerApi";
import { useAttractionVisitPeriodFormField } from "../add-attraction/AddAttraction.config";
import { EditAttractionVisitPeriodProps } from "./ListAttraction.types";

const EditAttractionVisitPeriod: React.FunctionComponent<
  EditAttractionVisitPeriodProps
> = (props) => {
  const { formFields, isFormValid } = useAttractionVisitPeriodFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction visit period for ${props.attractionName}`}
      text={"Visit period"}
      onUpdateClick={async () => {
        await changeAttractionVisitPeriod(
          String(props.attractionId),
          formFields.optimalVisitPeriod?.value
            ? {
                fromDate: formFields.optimalVisitPeriod?.value.from,
                toDate: formFields.optimalVisitPeriod?.value.to
              }
            : undefined
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <Stack>
        <Text as="label">Where to visit</Text>
        <DateRangePicker {...formFields.optimalVisitPeriod} />
      </Stack>
    </EditProperty>
  );
};

export default EditAttractionVisitPeriod;
