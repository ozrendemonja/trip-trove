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
import Navigation from "../../../../shared/navigation/Navigation";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { saveNewCity } from "../../infra/ManagerApi";
import { useCityFormField } from "./AddCity.config";
import { useClasses } from "./AddCity.styles";
import { useSaveShortcut } from "../../../../shared/hooks/UseSaveShortcut";
import { useSaveError } from "../../../../shared/hooks/UseSaveError";

export const AddCity: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useCityFormField();
  const navigate = useNavigate();
  const nameFieldRef = useRef<ITextField>(null);
  const { nameConflict, saveError, handleSaveError } = useSaveError({
    nameConflictMessage: "A city with this name already exists.",
    saveErrorMessage:
      "The city wasn't saved. Your details are still here, so you can review or edit them and try again.",
    focusRef: nameFieldRef,
    resetKey: formFields.cityName.value
  });

  const handleSave = async (): Promise<void> => {
    if (!isFormValid) {
      return;
    }

    try {
      await saveNewCity(formFields.cityName.value!, formFields.regionId.value!);
    } catch (error) {
      handleSaveError(error);
      return;
    }

    navigate(-1);
  };

  useSaveShortcut(() => void handleSave());

  return (
    <>
      <Navigation />
      <Stack className={classes.root}>
        <Stack horizontal tokens={{ childrenGap: 48 }}>
          <Text as="h1" className={classes.header}>
            Add City
          </Text>
          <SearchText {...formFields.regionId} />
        </Stack>
        <Separator></Separator>
        <Stack tokens={{ childrenGap: 12 }} className={classes.formText}>
          <Stack.Item grow={1}>
            <TextField
              {...formFields.cityName}
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

export default AddCity;
