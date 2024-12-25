import {
  DefaultButton,
  IconButton,
  Modal,
  PrimaryButton,
  Stack,
  Text,
  TextField
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { changeCountryDetails } from "../../../../features/continent/infra/ManagerApi";
import { useCountryDetailsFormField } from "../../../../features/continent/pages/add-country/AddCountry.config";
import { useDragOptions } from "./EditProperty.config";
import { useClasses } from "./EditProperty.styles";
import { EditPropertyCountryDetailsProps } from "./EditProperty.types";

const EditPropertyCountryDetails: React.FunctionComponent<
  EditPropertyCountryDetailsProps
> = (props) => {
  const classes = useClasses();
  const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(true);
  const [
    blockButton,
    { setTrue: disableDiaglogButtons, setFalse: enableDiaglogButtons }
  ] = useBoolean(false);
  const { formFields, isFormValid } = useCountryDetailsFormField();
  formFields.countryName.placeholder = props.text;

  return (
    <>
      <IconButton
        iconProps={{ iconName: "Edit" }}
        ariaLabel={`Change value for ${props.text}`}
        className={classes.editIcon}
        onClick={toggleHideDialog}
      />
      <Modal
        isOpen={!hideDialog}
        onDismiss={toggleHideDialog}
        isBlocking={true}
        containerClassName={classes.modalContainer}
        dragOptions={useDragOptions()}
      >
        <Stack horizontal={true} className={classes.header}>
          <Text as="h1" className={classes.heading}>
            Modifying {props.text}
          </Text>
          <IconButton
            className={classes.closeIcon}
            iconProps={{ iconName: "Cancel" }}
            ariaLabel="Close modify popup"
            onClick={toggleHideDialog}
          />
        </Stack>
        <Stack tokens={{ childrenGap: 12 }} className={classes.form}>
          <Stack.Item grow={1}>
            <TextField {...formFields.countryName} />
          </Stack.Item>
        </Stack>
        <Stack
          tokens={{ childrenGap: 12 }}
          enableScopedSelectors
          horizontalAlign="end"
          horizontal={true}
          className={classes.footer}
        >
          <PrimaryButton
            onClick={async () => {
              disableDiaglogButtons();
              await changeCountryDetails(
                String(props.countryId),
                formFields.countryName.value!
              );
              props.onUpdateClick();
              toggleHideDialog();
              enableDiaglogButtons();
            }}
            text="Update"
            disabled={blockButton || !isFormValid}
          />
          <DefaultButton
            onClick={() => {
              toggleHideDialog();
              enableDiaglogButtons();
            }}
            text="Cancel"
            disabled={blockButton}
          />
        </Stack>
      </Modal>
    </>
  );
};

export default EditPropertyCountryDetails;
