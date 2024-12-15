import { ContextualMenu, DefaultButton, Dialog, DialogFooter, DialogType, IconButton, PrimaryButton, Stack, Text, TextField } from "@fluentui/react";
import { EditPropertyProps } from "./EditProperty.types";
import { changeContinentName } from "../../../../features/continent/infra/managerApi";
import { useBoolean } from '@fluentui/react-hooks';
import { useContinentFormField } from "../../../../features/continent/pages/AddContinent.config";
import { useClasses } from "../../../../features/continent/pages/AddContinent.styles";

const EditProperty: React.FunctionComponent<EditPropertyProps> = props => {
    const classes = useClasses();
    const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(true);
    const [blockButton, { setTrue: disableDiaglogButtons, setFalse: enableDiaglogButtons }] = useBoolean(false);
    const dialogContentProps = {
        type: DialogType.normal,
        title: `Modifying ${props.text}`,
    };
    const dragOptions = {
        moveMenuItemText: 'Move',
        closeMenuItemText: 'Close',
        menu: ContextualMenu,
    };
    const { formFields, isFormValid } = useContinentFormField();
    formFields.continentName.placeholder = props.text;

    return (
        <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
            <Text>{props.text}</Text>
            <IconButton iconProps={{ iconName: "Edit", styles: { root: { color: "#fec703" } } }} onClick={toggleHideDialog} />
            {props.isOptional && <IconButton iconProps={{ iconName: "Delete", styles: { root: { color: "red" } } }} />}
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
                <Stack tokens={{ childrenGap: 12 }} className={classes.form}>
                    <Stack.Item grow={1} >
                        <TextField {...formFields.continentName} />
                    </Stack.Item>
                </Stack>
                <DialogFooter>
                    <PrimaryButton onClick={async () => {
                        disableDiaglogButtons();
                        await changeContinentName(props.text!, formFields.continentName.value!);
                        toggleHideDialog();
                        enableDiaglogButtons();
                    }
                    } text="Update" disabled={blockButton || !isFormValid} />
                    <DefaultButton onClick={() => {
                        toggleHideDialog();
                        enableDiaglogButtons();
                    }} text="Cancel" disabled={blockButton} />
                </DialogFooter>
            </Dialog>
        </Stack>
    );
}

export default EditProperty;