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
import Navigation from "../../../../shared/navigation/Navigation";
import { SearchText } from "../../../../shared/search-text/SearchText";
import { saveNewCity } from "../../infra/ManagerApi";
import { useCityFormField } from "./AddCity.config";
import { useClasses } from "./AddCity.styles";

export const AddCity: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useCityFormField();
  const navigate = useNavigate();

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
            <TextField {...formFields.cityName} />
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
              saveNewCity(
                formFields.cityName.value!,
                formFields.regionId.value!
              );
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

export default AddCity;
