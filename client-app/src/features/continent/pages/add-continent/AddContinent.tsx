import {
  InputField,
  InputFieldHandle
} from "../../../../shared/ui/forms/InputField";
import { Button } from "@fluentui/react-components";
import {
  Divider,
  MessageBar,
  MessageBarBody,
  Text
} from "@fluentui/react-components";
import React, { useRef } from "react";
import { useNavigate } from "react-router";
import { saveNewContinent } from "../../infra/ManagerApi";
import { useContinentFormField } from "./AddContinent.config";
import { useClasses } from "./AddContinent.styles";
import Navigation from "../../../../shared/navigation/Navigation";
import { useSaveShortcut } from "../../../../shared/hooks/UseSaveShortcut";
import { useSaveError } from "../../../../shared/hooks/UseSaveError";
import { Flex, FlexItem } from "../../../../shared/ui/Flex";

export const AddContinent: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useContinentFormField();
  const navigate = useNavigate();
  const nameFieldRef = useRef<InputFieldHandle>(null);
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
      <Flex className={classes.root}>
        <Text as="h1" className={classes.header}>
          Add Continent
        </Text>
        <Divider className={classes.headerDivider} />
        <Flex gap={16} className={classes.form}>
          <FlexItem grow={1}>
            <InputField
              {...formFields.continentName}
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
          <Button appearance="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            onClick={() => void handleSave()}
            disabled={!isFormValid}
          >
            Save
          </Button>
        </Flex>
      </Flex>
    </>
  );
};

export default AddContinent;
