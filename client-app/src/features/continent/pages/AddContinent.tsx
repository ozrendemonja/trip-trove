import * as yup from "yup";
import { DefaultButton, ITextFieldProps, PrimaryButton, Separator, Stack, Text, TextField } from '@fluentui/react';
import React, { useState } from 'react';
import { useClasses } from './AddContinent.styles';
import { useNavigate } from "react-router";

const createContinentNameValidation = () => {
    return yup.object({
        continentName: yup
            .string()
            .trim()
            .ensure()
            .required("Continent name may not be null or empty")
            .max(64, ({ max }) => `Continent name may not be longer then ${max} characters`)
    })
};

export const AddContinent: React.FunctionComponent = props => {
    const classes = useClasses();
    const validation = createContinentNameValidation();
    const initialTouched = {
        continentName: false
    };
    const [touched, setTouched] = useState(initialTouched);
    const [continentName, setContinentName] = useState("");
    const isFormValid = validation.isValidSync({ continentName: continentName });

    const continentNameField: ITextFieldProps = {
        name: "name",
        label: "Continent name",
        value: continentName,
        onChange: (_, value) => {
            console.log(value);
            console.log(isFormValid);
            setTouched({ ...touched, continentName: true });
            setContinentName(value || "");
        },
        onGetErrorMessage: (value: string) => {
            try {
                validation.validateSync({ continentName: continentName }, { abortEarly: false });
            } catch (error: unknown) {
                const typedError = error as Error;
                if (typedError.name === "ValidationError") {
                    return touched.continentName ? (typedError as yup.ValidationError).errors[0] : undefined;
                }
                throw error;
            }
            return undefined;
        },
        validateOnLoad: false,
        validateOnFocusOut: true,
        required: true
    };
    const navigate = useNavigate();

    return (
        <div className={classes.root}>
            <Text as="h1" className={classes.header}>Add Continent</Text>
            <Separator></Separator>
            <Stack tokens={{ childrenGap: 12 }}>
                <Stack.Item grow={1} style={{
                    maxWidth: "600px",
                    marginLeft: "25px",
                }} >
                    <TextField {...continentNameField} />
                </Stack.Item>
            </Stack>
            <Stack
                horizontal
                horizontalAlign="end"
                className={classes.footer}
                tokens={{ childrenGap: 12 }}
                style={{
                    height: "40px",
                    width: "100%",
                    marginTop: "auto",
                }}
            >
                <DefaultButton onClick={() => navigate(-1)} text="Cancel" />
                <PrimaryButton
                    onClick={() => void onSubmit(formValues)}
                    disabled={!isFormValid}
                    text="Save"
                />
            </Stack>
        </div >
    );
}

export default AddContinent;