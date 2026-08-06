import {
  DefaultButton,
  IconButton,
  MessageBar,
  MessageBarType,
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
import { getApiErrorCode } from "../../../hooks/UseSaveError";
import { useEffect, useRef, useState } from "react";

const EditProperty: React.FunctionComponent<EditPropertyProps> = (props) => {
  const classes = useClasses();
  const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(true);
  const [
    blockButton,
    { setTrue: disableDiaglogButtons, setFalse: enableDiaglogButtons }
  ] = useBoolean(false);
  const [submitError, setSubmitError] = useState<string>();
  const formRef = useRef<HTMLDivElement>(null);

  const isControlled = props.isOpen !== undefined;
  const isModalOpen = isControlled ? (props.isOpen ?? false) : !hideDialog;

  useEffect(() => {
    setSubmitError(undefined);
  }, [props.submitErrorResetKey]);

  const handleClose = () => {
    setSubmitError(undefined);
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
    setSubmitError(undefined);
    try {
      const shouldClose = await props.onUpdateClick();
      if (shouldClose !== false) {
        handleClose();
      }
    } catch (error) {
      const isNameConflict = getApiErrorCode(error) === "NAME_CONFLICT";
      setSubmitError(
        isNameConflict && props.conflictErrorMessage
          ? props.conflictErrorMessage
          : (props.saveErrorMessage ??
              "The changes weren't saved. Your details are still here, so you can review or edit them and try again.")
      );
      if (isNameConflict) {
        formRef.current
          ?.querySelector<HTMLElement>(
            'input:not([type="hidden"]), textarea, [role="combobox"]'
          )
          ?.focus();
      }
    } finally {
      enableDiaglogButtons();
    }
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
        <Stack
          tokens={{ childrenGap: 12 }}
          className={classes.form}
          ref={formRef}
          onChange={() => setSubmitError(undefined)}
        >
          <Stack.Item grow={1}>{props.children}</Stack.Item>
          {submitError && (
            <MessageBar messageBarType={MessageBarType.error}>
              {submitError}
            </MessageBar>
          )}
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
