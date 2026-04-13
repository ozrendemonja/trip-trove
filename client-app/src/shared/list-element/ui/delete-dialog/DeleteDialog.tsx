import {
  CommandBar,
  IContextualMenuItem
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import {
  AddRowOptionsProps,
  DeleteDialogProps,
  DeleteRowOptionsProps
} from "./DeleteDialog.types";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";

const getCommandItems = (
  haveSelectedItem: boolean,
  addRowOptions: AddRowOptionsProps,
  deleteRowOptions: DeleteRowOptionsProps
): IContextualMenuItem[] => {
  return [
    {
      key: `addRow-${addRowOptions.text}`,
      text: addRowOptions.text,
      iconProps: { iconName: "Add" },
      onClick: addRowOptions.onAddRow
    },
    {
      key: `deleteRow-${deleteRowOptions.text}`,
      text: deleteRowOptions.text,
      iconProps: { iconName: "Delete" },
      onClick: deleteRowOptions.onDeleteRow,
      disabled: haveSelectedItem
    }
  ];
};

const DeleteDialog: React.FunctionComponent<DeleteDialogProps> = (props) => {
  const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(true);
  const deleteRowOptions: DeleteRowOptionsProps = {
    text: props.deleteRowOptions.text,
    onDeleteRow: toggleHideDialog
  };

  return (
    <>
      <CommandBar
        items={getCommandItems(
          props.selectedItem.haveSelectedItem,
          props.addRowOptions,
          deleteRowOptions
        )}
      />
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
