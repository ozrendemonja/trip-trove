import { DefaultButton, Dialog, DialogFooter, IconButton, PrimaryButton, Stack, TextField } from "@fluentui/react";
import { useBoolean } from '@fluentui/react-hooks';
import { changeContinentName } from "../../../../features/continent/infra/managerApi";
import { useContinentFormField } from "../../../../features/continent/pages/AddContinent.config";
import { useDialogContentProps, useDragOptions } from "./EditProperty.config";
import { useClasses } from "./EditProperty.styles";
import { EditPropertyProps } from "./EditProperty.types";

const EditProperty: React.FunctionComponent<EditPropertyProps> = props => {
    const classes = useClasses();
    const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(true);
    const [blockButton, { setTrue: disableDiaglogButtons, setFalse: enableDiaglogButtons }] = useBoolean(false);
    const { formFields, isFormValid } = useContinentFormField();
    formFields.continentName.placeholder = props.text;

    return (
        <>
            <IconButton iconProps={{ iconName: "Edit" }} ariaLabel={`Change value for ${props.text}`} className={classes.editIcon} onClick={toggleHideDialog} />
            <Dialog
                hidden={hideDialog}
                onDismiss={() => {
                    enableDiaglogButtons();
                    toggleHideDialog();
                }}
                dialogContentProps={useDialogContentProps(props.text)}
                modalProps={{
                    isBlocking: true,
                    dragOptions: useDragOptions(),
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
                        await changeContinentName(props.text, formFields.continentName.value!);
                        toggleHideDialog();
                        enableDiaglogButtons();
                    }
                    } text="Update" disabled={blockButton || !isFormValid} />
                    <DefaultButton onClick={() => {
                        toggleHideDialog();
                        enableDiaglogButtons();
                    }} text="Cancel" />
                </DialogFooter>
            </Dialog>
        </>
    );
}

export default EditProperty;