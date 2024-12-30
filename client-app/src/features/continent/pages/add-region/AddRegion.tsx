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
import { saveNewRegion } from "../../infra/ManagerApi";
import { useRegionFormField } from "./AddRegion.config";
import { useClasses } from "./AddRegion.styles";

export const AddRegion: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useRegionFormField();
  const navigate = useNavigate();

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
            <TextField {...formFields.regionName} />
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
              saveNewRegion(
                formFields.regionName.value!,
                formFields.countryId.value!
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

export default AddRegion;
