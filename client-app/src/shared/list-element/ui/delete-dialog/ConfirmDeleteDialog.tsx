import {
  ContextualMenu,
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  PrimaryButton
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React from "react";

export interface ConfirmDeleteDialogProps {
  name: string;
  hidden: boolean;
  onConfirm: () => Promise<void> | void;
  onDismiss: () => void;
}

const dragOptions = {
  moveMenuItemText: "Move",
  closeMenuItemText: "Close",
  menu: ContextualMenu
};

const ConfirmDeleteDialog: React.FunctionComponent<
  ConfirmDeleteDialogProps
> = (props) => {
  const [
    blockButton,
    { setTrue: disableButtons, setFalse: enableButtons }
  ] = useBoolean(false);

  const dialogContentProps = {
    type: DialogType.normal,
    title: `Delete ${props.name}`,
    subText: `Are you sure you want to delete ${props.name}?`
  };

  const handleDismiss = (): void => {
    enableButtons();
    props.onDismiss();
  };

  return (
    <Dialog
      hidden={props.hidden}
      onDismiss={handleDismiss}
      dialogContentProps={dialogContentProps}
      modalProps={{
        isBlocking: true,
        dragOptions: dragOptions
      }}
    >
      <DialogFooter>
        <PrimaryButton
          onClick={async () => {
            disableButtons();
            await props.onConfirm();
            enableButtons();
          }}
          text="Delete"
          disabled={blockButton}
        />
        <DefaultButton
          onClick={handleDismiss}
          text="Cancel"
          disabled={blockButton}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
