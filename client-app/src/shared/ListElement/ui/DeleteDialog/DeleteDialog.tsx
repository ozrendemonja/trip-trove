import { CommandBar, ContextualMenu, DefaultButton, Dialog, DialogFooter, DialogType, IContextualMenuItem, PrimaryButton } from "@fluentui/react";
import { useBoolean } from '@fluentui/react-hooks';
import { AddRowOptionsProps, DeleteDialogProps, DeleteRowOptionsProps } from "./DeleteDialog.types";

const getCommandItems = (haveSelectedItem: boolean, addRowOptions: AddRowOptionsProps, deleteRowOptions: DeleteRowOptionsProps): IContextualMenuItem[] => {
    return [
        {
            key: `addRow-${addRowOptions.text}`,
            text: addRowOptions.text,
            iconProps: { iconName: 'Add' },
            onClick: addRowOptions.onAddRow,
        },
        {
            key: `deleteRow-${deleteRowOptions.text}`,
            text: deleteRowOptions.text,
            iconProps: { iconName: 'Delete' },
            onClick: deleteRowOptions.onDeleteRow,
            disabled: haveSelectedItem,
        },
    ];
};

const DeleteDialog: React.FunctionComponent<DeleteDialogProps> = (props) => {
    const dragOptions = {
        moveMenuItemText: 'Move',
        closeMenuItemText: 'Close',
        menu: ContextualMenu,
    };
    const dialogContentProps = {
        type: DialogType.normal,
        title: `Delete ${props.selectedItem.name}`,
        subText: `Are you sure you want to delete ${props.selectedItem.name}?`,
    };

    const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(true);
    const [blockButton, { setTrue: disableDiaglogButtons, setFalse: enableDiaglogButtons }] = useBoolean(false);
    const deleteRowOptions: DeleteRowOptionsProps = {
        text: props.deleteRowOptions.text,
        onDeleteRow: toggleHideDialog
    }

    return (
        <>
            <CommandBar items={getCommandItems(props.selectedItem.haveSelectedItem, props.addRowOptions, deleteRowOptions)} />
            <Dialog
                hidden={hideDialog}
                onDismiss={() => {
                    enableDiaglogButtons();
                    toggleHideDialog();
                }}
                dialogContentProps={dialogContentProps}
                modalProps={{
                    isBlocking: true,
                    dragOptions: dragOptions,
                }}
            >
                <DialogFooter>
                    <PrimaryButton onClick={async () => {
                        disableDiaglogButtons();
                        await props.deleteRowOptions.onDeleteRow();
                        toggleHideDialog();
                        enableDiaglogButtons();
                    }
                    } text="Delete" disabled={blockButton} />
                    <DefaultButton onClick={() => {
                        toggleHideDialog();
                        enableDiaglogButtons();
                    }} text="Cancel" disabled={blockButton} />
                </DialogFooter>
            </Dialog>
        </>
    );
};

export default DeleteDialog;