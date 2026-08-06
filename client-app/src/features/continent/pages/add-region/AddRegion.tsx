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
import Navigation from "../../../../shared/navigation/Navigation";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { saveNewRegion } from "../../infra/ManagerApi";
import { useRegionFormField } from "./AddRegion.config";
import { useClasses } from "./AddRegion.styles";
import { useSaveShortcut } from "../../../../shared/hooks/UseSaveShortcut";
import { useSaveError } from "../../../../shared/hooks/UseSaveError";
import { Flex, FlexItem } from "../../../../shared/ui/Flex";

export const AddRegion: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useRegionFormField();
  const navigate = useNavigate();
  const nameFieldRef = useRef<InputFieldHandle>(null);
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
      <Flex className={classes.root}>
        <Flex direction="row" gap={48}>
          <Text as="h1" className={classes.header}>
            Add Region
          </Text>
          <SearchText {...formFields.countryId} showRequiredIndicator />
        </Flex>
        <Divider className={classes.headerDivider} />
        <Flex gap={16} className={classes.formText}>
          <FlexItem grow={1}>
            <InputField
              {...formFields.regionName}
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

export default AddRegion;
