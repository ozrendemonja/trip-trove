import {
  InputField,
  InputFieldHandle
} from "../../../../shared/ui/forms/InputField";
import {
  Divider,
  MessageBar,
  MessageBarBody,
  Text
} from "@fluentui/react-components";
import { Button } from "@fluentui/react-components";
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import Navigation from "../../../../shared/navigation/Navigation";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { saveNewCity } from "../../infra/ManagerApi";
import { useCityFormField } from "./AddCity.config";
import { useClasses } from "./AddCity.styles";
import { useSaveShortcut } from "../../../../shared/hooks/UseSaveShortcut";
import { useSaveError } from "../../../../shared/hooks/UseSaveError";
import { Flex, FlexItem } from "../../../../shared/ui/Flex";
import { PendingButton } from "../../../../shared/ui/PendingButton";

export const AddCity: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useCityFormField();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const nameFieldRef = useRef<InputFieldHandle>(null);
  const { nameConflict, saveError, handleSaveError } = useSaveError({
    nameConflictMessage: "A city with this name already exists.",
    saveErrorMessage:
      "The city wasn't saved. Your details are still here, so you can review or edit them and try again.",
    focusRef: nameFieldRef,
    resetKey: formFields.cityName.value
  });

  const handleSave = async (): Promise<void> => {
    if (isSaving || !isFormValid) {
      return;
    }

    setIsSaving(true);
    try {
      await saveNewCity(formFields.cityName.value!, formFields.regionId.value!);
      navigate(-1);
    } catch (error) {
      handleSaveError(error);
    } finally {
      setIsSaving(false);
    }
  };

  useSaveShortcut(() => void handleSave());

  return (
    <>
      <Navigation />
      <Flex className={classes.root}>
        <Flex direction="row" gap={48}>
          <Text as="h1" className={classes.header}>
            Add City
          </Text>
          <SearchText {...formFields.regionId} showRequiredIndicator />
        </Flex>
        <Divider className={classes.headerDivider} />
        <Flex gap={16} className={classes.formText}>
          <FlexItem grow={1}>
            <InputField
              {...formFields.cityName}
              ref={nameFieldRef}
              errorMessage={nameConflict}
              showRequiredIndicator
            />
          </FlexItem>
        </Flex>
        {saveError && (
          <Flex className={classes.saveError}>
            <MessageBar intent="error">
              <MessageBarBody>{saveError}</MessageBarBody>
            </MessageBar>
          </Flex>
        )}
        <Flex
          direction="row"
          justify="flex-end"
          className={classes.footer}
          gap={12}
        >
          <Button
            appearance="secondary"
            onClick={() => navigate(-1)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <PendingButton
            appearance="primary"
            pending={isSaving}
            pendingText="Saving..."
            onClick={() => void handleSave()}
            disabled={!isFormValid}
          >
            Save
          </PendingButton>
        </Flex>
      </Flex>
    </>
  );
};

export default AddCity;
