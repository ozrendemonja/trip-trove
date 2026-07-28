import {
  DefaultButton,
  IconButton,
  Modal,
  PrimaryButton,
  Stack,
  Text
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useDragOptions } from "./EditProperty.config";
import { useClasses } from "./EditProperty.styles";
import { EditPropertyProps } from "./EditProperty.types";
import { useSaveShortcut } from "../../../hooks/UseSaveShortcut";

const EditProperty: React.FunctionComponent<EditPropertyProps> = (props) => {
  const classes = useClasses();
  const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(true);
  const [
    blockButton,
    { setTrue: disableDiaglogButtons, setFalse: enableDiaglogButtons }
  ] = useBoolean(false);

  const isControlled = props.isOpen !== undefined;
  const isModalOpen = isControlled ? (props.isOpen ?? false) : !hideDialog;

  const handleClose = () => {
    if (isControlled) {
      props.onDismiss?.();
    } else {
      toggleHideDialog();
      enableDiaglogButtons();
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (blockButton || !props.isFormValid) {
      return;
    }
    disableDiaglogButtons();
    await props.onUpdateClick();
    handleClose();
    enableDiaglogButtons();
  };

  useSaveShortcut(() => void handleSubmit(), isModalOpen);

  return (
    <>
      {!isControlled && (
        <IconButton
          iconProps={{ iconName: props.editIconName ?? "Edit" }}
          ariaLabel={props.editIconAriaLabel}
          className={classes.editIcon}
          onClick={toggleHideDialog}
        />
      )}
      <Modal
        isOpen={isModalOpen}
        onDismiss={handleClose}
        isBlocking={true}
        containerClassName={classes.modalContainer}
        dragOptions={useDragOptions()}
      >
        <Stack horizontal={true} className={classes.header}>
          <Text as="h1" className={classes.heading}>
            {props.title ?? `Modifying ${props.text}`}
          </Text>
          <IconButton
            className={classes.closeIcon}
            iconProps={{ iconName: "Cancel" }}
            ariaLabel="Close modify popup"
            onClick={handleClose}
          />
        </Stack>
        <Stack tokens={{ childrenGap: 12 }} className={classes.form}>
          <Stack.Item grow={1}>{props.children}</Stack.Item>
        </Stack>
        <Stack
          tokens={{ childrenGap: 12 }}
          enableScopedSelectors
          horizontalAlign="end"
          horizontal={true}
          className={classes.footer}
        >
          <PrimaryButton
            onClick={handleSubmit}
            text={props.submitText ?? "Update"}
            disabled={blockButton || !props.isFormValid}
          />
          <DefaultButton
            onClick={handleClose}
            text="Cancel"
            disabled={blockButton}
          />
        </Stack>
      </Modal>
    </>
  );
};

export default EditProperty;
