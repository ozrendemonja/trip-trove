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
import { saveNewRegion } from "../../infra/ManagerApi";
import { useRegionFormField } from "./AddRegion.config";
import { useClasses } from "./AddRegion.styles";
import { useSaveShortcut } from "../../../../shared/hooks/UseSaveShortcut";
import { useSaveError } from "../../../../shared/hooks/UseSaveError";

export const AddRegion: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useRegionFormField();
  const navigate = useNavigate();
  const nameFieldRef = useRef<ITextField>(null);
  const { nameConflict, saveError, handleSaveError } = useSaveError({
    nameConflictMessage: "A region with this name already exists.",
    saveErrorMessage:
      "The region wasn't saved. Your details are still here, so you can review or edit them and try again.",
    focusRef: nameFieldRef,
    resetKey: formFields.regionName.value
  });

  const handleSave = async (): Promise<void> => {
    if (!isFormValid) {
      return;
    }

    try {
      await saveNewRegion(
        formFields.regionName.value!,
        formFields.countryId.value!
      );
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
            Add Region
          </Text>
          <SearchText {...formFields.countryId} />
        </Stack>
        <Separator></Separator>
        <Stack tokens={{ childrenGap: 12 }} className={classes.formText}>
          <Stack.Item grow={1}>
            <TextField
              {...formFields.regionName}
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

export default AddRegion;
