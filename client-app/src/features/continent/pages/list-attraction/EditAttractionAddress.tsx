import { InputField } from "../../../../shared/ui/forms/InputField";
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
      <InputField
        {...formFields.address}
        style={{ width: "100%" }}
        // className={classes.attractionName}
      />
      <InputField {...formFields.geoLocation} style={{ width: "200px" }} />
    </EditProperty>
  );
};

export default EditAttractionAddress;
