import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  shorthands,
  tokens
} from "@fluentui/react-components";
import { useBooleanState } from "../../../hooks/useBooleanState";
import { PendingButton } from "../../../ui/PendingButton";
import React from "react";

const useStyles = makeStyles({
  deleteButton: {
    backgroundColor: tokens.colorPaletteRedForeground1,
    ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
    color: tokens.colorNeutralForegroundStaticInverted,
    "&:hover, &:active": {
      backgroundColor: tokens.colorPaletteRedForeground1,
      ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
      color: tokens.colorNeutralForegroundStaticInverted
    }
  }
});

export interface ConfirmDeleteDialogProps {
  name: string;
  hidden: boolean;
  onConfirm: () => Promise<void> | void;
  onDismiss: () => void;
}

const ConfirmDeleteDialog: React.FunctionComponent<ConfirmDeleteDialogProps> = (
  props
) => {
  const styles = useStyles();
  const [blockButton, { setTrue: disableButtons, setFalse: enableButtons }] =
    useBooleanState(false);

  const handleDismiss = (): void => {
    enableButtons();
    props.onDismiss();
  };

  return (
    <Dialog
      open={!props.hidden}
      modalType="alert"
      onOpenChange={(_event, data) => {
        if (!data.open) {
          handleDismiss();
        }
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{`Delete ${props.name}`}</DialogTitle>
          <DialogContent>{`Are you sure you want to delete ${props.name}?`}</DialogContent>
          <DialogActions>
            <PendingButton
              appearance="primary"
              className={styles.deleteButton}
              pending={blockButton}
              pendingText="Deleting..."
              spinnerAppearance="inverted"
              onClick={async () => {
                disableButtons();
                try {
                  await props.onConfirm();
                } finally {
                  enableButtons();
                }
              }}
            >
              Delete
            </PendingButton>
            <Button
              appearance="secondary"
              onClick={handleDismiss}
              disabled={blockButton}
            >
              Cancel
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
