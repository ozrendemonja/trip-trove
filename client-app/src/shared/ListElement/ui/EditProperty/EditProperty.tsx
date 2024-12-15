import { DefaultButton, Dialog, DialogFooter, FontWeights, getTheme, IButtonStyles, IconButton, mergeStyleSets, Modal, PrimaryButton, Stack, Text, TextField } from "@fluentui/react";
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
    const theme = getTheme();

    const iconButtonStyles: Partial<IButtonStyles> = {
        root: {
            color: "blue",
            marginLeft: 'auto',
            marginTop: '4px',
            marginRight: '2px',
        },
        rootHovered: {
            color: "red",
        },
    };
    const contentStyles = mergeStyleSets({
        modalContainer: {
            minWidth: "700px",
        },
        header: [
            theme.fonts.xLargePlus,
            {
                flex: '1 1 auto',
                borderTop: `4px solid ${theme.palette.themePrimary}`,
                color: theme.palette.neutralPrimary,
                display: 'flex',
                alignItems: 'center',
                fontWeight: FontWeights.semibold,
                padding: '12px 12px 14px 24px',
            },
        ],
        heading: {
            color: theme.palette.neutralPrimary,
            fontWeight: FontWeights.semibold,
            fontSize: 'inherit',
            margin: '0',
        },
        footer: {
            padding: "5px",
            paddingTop: "24px",
            paddingBottom: "24px",
            marginTop: "16px",
            marginRight: "16px",
        }
    });


    return (
        <>
            <IconButton iconProps={{ iconName: "Edit" }} ariaLabel={`Change value for ${props.text}`} className={classes.editIcon} onClick={toggleHideDialog} />
            <Modal
                isOpen={!hideDialog}
                onDismiss={toggleHideDialog}
                isBlocking={true}
                containerClassName={contentStyles.modalContainer}
                dragOptions={useDragOptions()}
            >
                <Stack horizontal={true} className={contentStyles.header}>
                    <Text as="h1" className={contentStyles.heading}>Modifying {props.text}</Text>
                    <IconButton
                        styles={iconButtonStyles}
                        iconProps={{ iconName: 'Cancel' }}
                        ariaLabel="Close popup modal"
                        onClick={toggleHideDialog}
                    />
                </Stack>
                <Stack tokens={{ childrenGap: 12 }} className={classes.form}>
                    <Stack.Item grow={1} >
                        <TextField {...formFields.continentName} />
                    </Stack.Item>
                </Stack>
                <Stack tokens={{ childrenGap: 12 }} enableScopedSelectors horizontalAlign="end" horizontal={true} className={contentStyles.footer}>
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
                </Stack>
            </Modal>
        </>
    );
}

export default EditProperty;