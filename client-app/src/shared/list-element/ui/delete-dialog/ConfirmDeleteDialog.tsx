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
            <Button
              appearance="primary"
              className={styles.deleteButton}
              onClick={async () => {
                disableButtons();
                await props.onConfirm();
                enableButtons();
              }}
              disabled={blockButton}
            >
              Delete
            </Button>
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
