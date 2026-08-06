import {
  Button,
  makeStyles,
  shorthands,
  tokens
} from "@fluentui/react-components";
import { Add16Regular, Delete16Regular } from "@fluentui/react-icons";
import { useBooleanState } from "../../../hooks/useBooleanState";
import { DeleteDialogProps, DeleteRowOptionsProps } from "./DeleteDialog.types";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

const useStyles = makeStyles({
  deleteButton: {
    color: tokens.colorPaletteRedForeground1,
    ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
    transitionProperty: "none !important",
    "& svg": {
      color: tokens.colorPaletteRedForeground1
    },
    "&:hover, &:focus-visible": {
      backgroundColor: `${tokens.colorPaletteRedForeground1} !important`,
      ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
      color: `${tokens.colorNeutralForegroundStaticInverted} !important`,
      "& svg": {
        color: `${tokens.colorNeutralForegroundStaticInverted} !important`
      }
    },
    "&:disabled": {
      color: tokens.colorPaletteRedForeground1,
      ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
      opacity: 0.4,
      "& svg": {
        color: tokens.colorPaletteRedForeground1
      }
    }
  }
});

const DeleteDialog: React.FunctionComponent<DeleteDialogProps> = (props) => {
  const styles = useStyles();
  const [hideDialog, { toggle: toggleHideDialog }] = useBooleanState(true);
  const deleteRowOptions: DeleteRowOptionsProps = {
    text: props.deleteRowOptions.text,
    onDeleteRow: toggleHideDialog
  };

  return (
    <>
      <div
        key={`command-bar-${props.selectedItem.haveSelectedItem}`}
        role="menubar"
        style={{ display: "flex", gap: 4 }}
      >
        <Button
          role="menuitem"
          appearance="secondary"
          icon={<Add16Regular />}
          onClick={props.addRowOptions.onAddRow}
        >
          {props.addRowOptions.text}
        </Button>
        <Button
          role="menuitem"
          appearance="secondary"
          className={styles.deleteButton}
          icon={<Delete16Regular />}
          onClick={deleteRowOptions.onDeleteRow}
          disabled={props.selectedItem.haveSelectedItem}
        >
          {deleteRowOptions.text}
        </Button>
      </div>
      <ConfirmDeleteDialog
        name={props.selectedItem.name}
        hidden={hideDialog}
        onConfirm={async () => {
          await props.deleteRowOptions.onDeleteRow();
          toggleHideDialog();
        }}
        onDismiss={toggleHideDialog}
      />
    </>
  );
};

export default DeleteDialog;
