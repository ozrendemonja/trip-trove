import {
  ComboBox,
  DefaultButton,
  Dropdown,
  IDropdownOption,
  ITextField,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Separator,
  Stack,
  Text,
  TextField
} from "@fluentui/react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Navigation from "../../../../shared/navigation/Navigation";
import { Continent } from "../../domain/Continent.types";
import { getContinents, saveNewCountry } from "../../infra/ManagerApi";
import { useCountryFormField } from "./AddCountry.config";
import { useClasses } from "./AddCountry.styles";
import { useSaveShortcut } from "../../../../shared/hooks/UseSaveShortcut";
import { useSaveError } from "../../../../shared/hooks/UseSaveError";

const createOptions = (continents: Continent[]): IDropdownOption[] => {
  return continents
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((continent) => {
      return { key: continent.name, text: continent.name } as IDropdownOption;
    });
};

export const AddCountry: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useCountryFormField();
  const [continents, setContinents] = useState<Continent[]>([]);
  const nameFieldRef = useRef<ITextField>(null);
  const navigate = useNavigate();
  const { nameConflict, saveError, handleSaveError } = useSaveError({
    nameConflictMessage: "A country with this name already exists.",
    saveErrorMessage:
      "The country wasn't saved. Your details are still here, so you can review or edit them and try again.",
    focusRef: nameFieldRef,
    resetKey: formFields.countryName.value
  });

  useEffect(() => {
    getContinents().then(setContinents);
  }, []);

  const handleSave = async (): Promise<void> => {
    if (!isFormValid) {
      return;
    }

    try {
      await saveNewCountry(
        formFields.countryName.value!,
        formFields.continentName.value,
        formFields.isoCode!.value
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
            Add Country
          </Text>
          <Dropdown
            className={classes.formDropdown}
            {...formFields.continentName}
            options={createOptions(continents)}
          />
        </Stack>
        <Separator></Separator>
        <Stack tokens={{ childrenGap: 12 }} className={classes.formText}>
          <Stack.Item grow={1}>
            <TextField
              {...formFields.countryName}
              componentRef={nameFieldRef}
              errorMessage={nameConflict}
            />
          </Stack.Item>
          <Stack.Item grow={1}>
            <ComboBox {...formFields.isoCode!} />
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

export default AddCountry;
