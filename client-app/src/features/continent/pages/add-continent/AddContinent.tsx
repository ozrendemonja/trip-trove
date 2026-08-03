import {
  DefaultButton,
  ITextField,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Separator,
  Stack,
  Text,
  TextField
} from "@fluentui/react";
import React, { useRef } from "react";
import { useNavigate } from "react-router";
import { saveNewContinent } from "../../infra/ManagerApi";
import { useContinentFormField } from "./AddContinent.config";
import { useClasses } from "./AddContinent.styles";
import Navigation from "../../../../shared/navigation/Navigation";
import { useSaveShortcut } from "../../../../shared/hooks/UseSaveShortcut";
import { useSaveError } from "../../../../shared/hooks/UseSaveError";

export const AddContinent: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useContinentFormField();
  const navigate = useNavigate();
  const nameFieldRef = useRef<ITextField>(null);
  const { nameConflict, saveError, handleSaveError } = useSaveError({
    nameConflictMessage: "A continent with this name already exists.",
    saveErrorMessage:
      "The continent wasn't saved. Your details are still here, so you can review or edit them and try again.",
    focusRef: nameFieldRef,
    resetKey: formFields.continentName.value
  });

  const handleSave = async (): Promise<void> => {
    if (!isFormValid) {
      return;
    }

    try {
      await saveNewContinent(formFields.continentName.value!);
    } catch (error) {
      handleSaveError(error);
      return;
    }

    navigate("/");
  };

  useSaveShortcut(() => void handleSave());

  return (
    <>
      <Navigation />
      <Stack className={classes.root}>
        <Text as="h1" className={classes.header}>
          Add Continent
        </Text>
        <Separator></Separator>
        <Stack tokens={{ childrenGap: 12 }} className={classes.form}>
          <Stack.Item grow={1}>
            <TextField
              {...formFields.continentName}
              componentRef={nameFieldRef}
              errorMessage={nameConflict}
            />
          </Stack.Item>
        </Stack>
        {saveError && (
          <Stack className={classes.saveError}>
            <MessageBar messageBarType={MessageBarType.error}>
              {saveError}
            </MessageBar>
          </Stack>
        )}
        <Stack
          horizontal
          horizontalAlign="end"
          className={classes.footer}
          tokens={{ childrenGap: 12 }}
        >
          <DefaultButton onClick={() => navigate(-1)} text="Cancel" />
          <PrimaryButton
            onClick={() => void handleSave()}
            disabled={!isFormValid}
            text="Save"
          />
        </Stack>
      </Stack>
    </>
  );
};

export default AddContinent;
