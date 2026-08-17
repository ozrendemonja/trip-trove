import {
  ComboBoxField,
  SelectChoice,
  SelectField
} from "../../../../shared/ui/forms/SelectField";
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
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Navigation from "../../../../shared/navigation/Navigation";
import { Continent } from "../../domain/Continent.types";
import { getContinents, saveNewCountry } from "../../infra/ManagerApi";
import { useCountryFormField } from "./AddCountry.config";
import { useClasses } from "./AddCountry.styles";
import { useSaveShortcut } from "../../../../shared/hooks/UseSaveShortcut";
import {
  getApiErrorCode,
  useSaveError
} from "../../../../shared/hooks/UseSaveError";
import { Flex, FlexItem } from "../../../../shared/ui/Flex";
import { PendingButton } from "../../../../shared/ui/PendingButton";

const createOptions = (continents: Continent[]): SelectChoice[] => {
  return continents
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((continent) => {
      return { value: continent.name, label: continent.name } as SelectChoice;
    });
};

export const AddCountry: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useCountryFormField();
  const [continents, setContinents] = useState<Continent[]>([]);
  const [isoCodeConflict, setIsoCodeConflict] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const nameFieldRef = useRef<InputFieldHandle>(null);
  const navigate = useNavigate();
  const { nameConflict, saveError, handleSaveError, clearSaveErrors } =
    useSaveError({
      nameConflictMessage: "A country with this name already exists.",
      saveErrorMessage:
        "The country wasn't saved. Your details are still here, so you can review or edit them and try again.",
      focusRef: nameFieldRef,
      resetKey: formFields.countryName?.value
    });

  useEffect(() => {
    getContinents().then(setContinents);
  }, []);

  useEffect(() => {
    setIsoCodeConflict(undefined);
  }, [formFields.isoCode?.value]);

  const handleSave = async (): Promise<void> => {
    if (isSaving || !isFormValid) {
      return;
    }

    const countryName = formFields.countryName?.value;
    const continentName = formFields.continentName?.value;
    const isoCode = formFields.isoCode?.value;

    if (!countryName || !continentName || !isoCode) {
      return;
    }

    setIsSaving(true);
    try {
      await saveNewCountry(countryName, continentName, isoCode);
      navigate(-1);
    } catch (error) {
      if (getApiErrorCode(error) === "ISO_CODE_CONFLICT") {
        clearSaveErrors();
        setIsoCodeConflict("A country with this ISO code already exists.");
        return;
      }

      setIsoCodeConflict(undefined);
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
            Add Country
          </Text>
          <SelectField
            className={classes.formDropdown}
            {...formFields.continentName}
            label="Select a continent"
            choices={createOptions(continents)}
          />
        </Flex>
        <Divider className={classes.headerDivider} />
        <Flex gap={16} className={classes.formText}>
          <FlexItem grow={1}>
            <InputField
              {...formFields.countryName}
              ref={nameFieldRef}
              errorMessage={nameConflict}
              showRequiredIndicator
            />
          </FlexItem>
          <FlexItem grow={1}>
            <ComboBoxField
              {...formFields.isoCode!}
              errorMessage={isoCodeConflict ?? formFields.isoCode?.errorMessage}
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

export default AddCountry;
