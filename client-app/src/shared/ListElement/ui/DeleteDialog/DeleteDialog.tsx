import { CommandBar, ContextualMenu, DefaultButton, Dialog, DialogFooter, DialogType, IContextualMenuItem, PrimaryButton } from "@fluentui/react";
import { useBoolean } from '@fluentui/react-hooks';
import { DeleteDialogProps } from "./DeleteDialog.types";

const getCommandItems = (haveSelectedItem: boolean, onAddRow: any, addRowText: string, onDeleteRow: any, onDeleteRowText: string): IContextualMenuItem[] => {
    return [
        {
            key: 'addRow',
            text: addRowText,
            iconProps: { iconName: 'Add' },
            onClick: onAddRow,
        },
        {
            key: 'deleteRow',
            text: onDeleteRowText,
            iconProps: { iconName: 'Delete' },
            onClick: onDeleteRow,
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
    const modalPropsStyles = { main: { maxWidth: 450 } };

    const dialogContentProps = {
        type: DialogType.normal,
        title: 'Delete Continent',
        subText: 'Are you sure you want to delete Europe?',
    };

    const modalProps = {
        isBlocking: true,
        styles: modalPropsStyles,
        dragOptions: dragOptions,
    };

    const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(true);
    const [blockButton, { setTrue: disableDiaglogButtons, setFalse: enableDiaglogButtons }] = useBoolean(false);

    return (
        <>
            <CommandBar items={getCommandItems(props.haveSelectedItem, toggleHideDialog, props.addRowText, toggleHideDialog, props.onDeleteRowText)} />
            <Dialog
                hidden={hideDialog}
                onDismiss={() => {
                    toggleHideDialog();
                    enableDiaglogButtons();
                }}
                dialogContentProps={dialogContentProps}
                modalProps={modalProps}
            >
                <DialogFooter>
                    <PrimaryButton onClick={async () => {
                        disableDiaglogButtons();
                        await props.onDeleteRow();
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