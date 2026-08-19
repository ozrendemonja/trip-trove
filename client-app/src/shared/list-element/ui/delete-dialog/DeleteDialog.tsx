import { Button } from "@fluentui/react-components";
import { Add16Regular, Delete16Regular } from "@fluentui/react-icons";
import { useBooleanState } from "../../../hooks/useBooleanState";
import { DeleteDialogProps, DeleteRowOptionsProps } from "./DeleteDialog.types";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import { useDeleteDialogStyles } from "./DeleteDialog.styles";

const DeleteDialog: React.FunctionComponent<DeleteDialogProps> = (props) => {
  const styles = useDeleteDialogStyles();
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
        className={styles.commandBar}
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
