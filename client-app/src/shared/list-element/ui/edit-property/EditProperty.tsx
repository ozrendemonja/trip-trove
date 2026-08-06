import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarBody
} from "@fluentui/react-components";
import { Dismiss24Regular, Edit16Regular } from "@fluentui/react-icons";
import { Flex } from "../../../ui/Flex";
import { useBooleanState } from "../../../hooks/useBooleanState";
import { useClasses } from "./EditProperty.styles";
import { EditPropertyProps } from "./EditProperty.types";
import { useSaveShortcut } from "../../../hooks/UseSaveShortcut";
import { getApiErrorCode } from "../../../hooks/UseSaveError";
import { useId, useRef, useState } from "react";

const EditProperty: React.FunctionComponent<EditPropertyProps> = (props) => {
  const classes = useClasses();
  const [hideDialog, { toggle: toggleHideDialog }] = useBooleanState(true);
  const [
    blockButton,
    { setTrue: disableDiaglogButtons, setFalse: enableDiaglogButtons }
  ] = useBooleanState(false);
  const [submitError, setSubmitError] = useState<string>();
  const formRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const isControlled = props.isOpen !== undefined;
  const isModalOpen = isControlled ? (props.isOpen ?? false) : !hideDialog;

  const handleClose = (): void => {
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
            'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, [role="combobox"]'
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
        <Button
          appearance="subtle"
          data-list-edit-trigger
          icon={props.editIcon ?? <Edit16Regular />}
          aria-label={props.editIconAriaLabel}
          className={classes.editIcon}
          onClick={toggleHideDialog}
        />
      )}
      <Dialog
        open={isModalOpen}
        modalType="modal"
        onOpenChange={(_event, data) => {
          if (!data.open) {
            handleClose();
          }
        }}
      >
        <DialogSurface
          className={classes.modalContainer}
          aria-labelledby={headingId}
        >
          <DialogBody>
            <DialogTitle
              id={headingId}
              className={classes.heading}
              action={
                <Button
                  appearance="subtle"
                  className={classes.closeIcon}
                  icon={<Dismiss24Regular />}
                  aria-label="Close modify popup"
                  onClick={handleClose}
                />
              }
            >
              {props.title ?? `Modifying ${props.text}`}
            </DialogTitle>
            <DialogContent className={classes.content}>
              <Flex
                gap={12}
                className={classes.form}
                ref={formRef}
                onChange={() => setSubmitError(undefined)}
              >
                {props.children}
                {submitError && (
                  <MessageBar intent="error">
                    <MessageBarBody>{submitError}</MessageBarBody>
                  </MessageBar>
                )}
              </Flex>
            </DialogContent>
            <DialogActions className={classes.footer}>
              <Button
                appearance="primary"
                onClick={handleSubmit}
                disabled={blockButton || !props.isFormValid}
              >
                {props.submitText ?? "Update"}
              </Button>
              <Button
                appearance="secondary"
                onClick={handleClose}
                disabled={blockButton}
              >
                Cancel
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default EditProperty;
