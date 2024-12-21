import {
  DefaultButton,
  Dropdown,
  IDropdownOption,
  IDropdownProps,
  PrimaryButton,
  Separator,
  Stack,
  Text,
  TextField
} from "@fluentui/react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Navigation from "../../../../shared/navigation/Navigation";
import { useClasses } from "./AddCountry.styles";
import { useCountryFormField } from "./AddCountry.config";
import { getContinents, saveNewCountry } from "../../infra/ManagerApi";
import { Continent } from "../../domain/Continent.types";

const createOptions = (continents: Continent[]): IDropdownOption[] => {
  return continents.map((continent) => {
    return { key: continent.name, text: continent.name } as IDropdownOption;
  });
};

export const AddCountry: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useCountryFormField();
  const [continents, setContinents] = useState<Continent[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getContinents().then(setContinents);
  }, []);

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
            <TextField {...formFields.countryName} />
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
              saveNewCountry(formFields.countryName.value!);
              navigate(-1);
            }}
            disabled={!isFormValid}
            text="Save"
          />
        </Stack>
      </Stack>
    </>
  );
};

export default AddCountry;
