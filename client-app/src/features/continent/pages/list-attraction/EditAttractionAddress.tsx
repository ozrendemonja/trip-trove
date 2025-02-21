import { Stack, TextField } from "@fluentui/react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { changeAttractionAddress } from "../../infra/ManagerApi";
import { useAttractionAddressFormField } from "../add-attraction/AddAttraction.config";
import { EditAttractionAddressProps } from "./ListAttraction.types";

const EditAttractionAddress: React.FunctionComponent<
  EditAttractionAddressProps
> = (props) => {
  const { formFields, isFormValid } = useAttractionAddressFormField();

  return (
    <EditProperty
      editIconAriaLabel={`Change attraction address from ${props.address.streetAddress ?? props.address.location?.latitude ?? "not provide"}`}
      text={props.address.streetAddress ?? ""}
      onUpdateClick={async () => {
        const attractionLocation = formFields.geoLocation?.value
          ? {
              latitude: Number(formFields.geoLocation.value.split(",")[0]),
              longitude: Number(formFields.geoLocation.value.split(",")[1])
            }
          : undefined;
        await changeAttractionAddress(String(props.attractionId), {
          streetAddress: formFields.address?.value,
          location: attractionLocation
        });
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <Stack
        tokens={{ childrenGap: 48 }}
        horizontal={true}
        // className={classes.row}
      >
        <TextField
          {...formFields.address}
          // className={classes.attractionName}
        />
        <TextField {...formFields.geoLocation} />
      </Stack>
    </EditProperty>
  );
};

export default EditAttractionAddress;
