import {
  DefaultButton,
  PrimaryButton,
  Separator,
  Stack,
  Text,
  TextField
} from "@fluentui/react";
import React from "react";
import { useNavigate } from "react-router";
import { saveNewContinent } from "../../infra/ManagerApi";
import { useContinentFormField } from "./AddContinent.config";
import { useClasses } from "./AddContinent.styles";

export const AddContinent: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useContinentFormField();
  const navigate = useNavigate();

  return (
    <div className={classes.root}>
      <Text as="h1" className={classes.header}>
        Add Continent
      </Text>
      <Separator></Separator>
      <Stack tokens={{ childrenGap: 12 }} className={classes.form}>
        <Stack.Item grow={1}>
          <TextField {...formFields.continentName} />
        </Stack.Item>
      </Stack>
      <Stack
        horizontal
        horizontalAlign="end"
        className={classes.footer}
        tokens={{ childrenGap: 12 }}
      >
        <DefaultButton onClick={() => navigate(-1)} text="Cancel" />
        <PrimaryButton
          onClick={() => {
            saveNewContinent(formFields.continentName.value!);
            navigate("/");
          }}
          disabled={!isFormValid}
          text="Save"
        />
      </Stack>
    </div>
  );
};

export default AddContinent;
