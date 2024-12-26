import {
  DefaultButton,
  Dropdown,
  IconButton,
  IDropdownOption,
  Modal,
  PrimaryButton,
  Stack,
  Text
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { useEffect, useState } from "react";
import { Continent } from "../../../../features/continent/domain/Continent.types";
import {
  changeCountryContinent,
  getContinents
} from "../../../../features/continent/infra/ManagerApi";
import { useCountryContinentFormField } from "../../../../features/continent/pages/add-country/AddCountry.config";
import { useDragOptions } from "./EditProperty.config";
import { useClasses } from "./EditProperty.styles";
import { EditPropertyCountryDetailsProps } from "./EditProperty.types";

const createOptions = (continents: Continent[]): IDropdownOption[] => {
  return continents.map((continent) => {
    return { key: continent.name, text: continent.name } as IDropdownOption;
  });
};

const EditPropertyCountryContinentDetails: React.FunctionComponent<
  EditPropertyCountryDetailsProps
> = (props) => {
  const classes = useClasses();
  const [hideDialog, { toggle: toggleHideDialog }] = useBoolean(true);
  const [
    blockButton,
    { setTrue: disableDiaglogButtons, setFalse: enableDiaglogButtons }
  ] = useBoolean(false);
  const { formFields, isFormValid } = useCountryContinentFormField();
  const [continents, setContinents] = useState<Continent[]>([]);

  useEffect(() => {
    getContinents().then(setContinents);
  }, []);

  return (
    <>
      <IconButton
        iconProps={{ iconName: "Edit" }}
        ariaLabel={`Change continent name from ${props.text}`}
        className={classes.editIcon}
        onClick={toggleHideDialog}
      />
      <Modal
        isOpen={!hideDialog}
        onDismiss={toggleHideDialog}
        isBlocking={true}
        containerClassName={classes.modalContainer}
        dragOptions={useDragOptions()}
      >
        <Stack horizontal={true} className={classes.header}>
          <Text as="h1" className={classes.heading}>
            Modifying {props.text}
          </Text>
          <IconButton
            className={classes.closeIcon}
            iconProps={{ iconName: "Cancel" }}
            ariaLabel="Close modify popup"
            onClick={toggleHideDialog}
          />
        </Stack>
        <Stack tokens={{ childrenGap: 12 }} className={classes.form}>
          <Stack.Item grow={1}>
            <Dropdown
              className={classes.form}
              {...formFields.continentName}
              options={createOptions(continents)}
            />
          </Stack.Item>
        </Stack>
        <Stack
          tokens={{ childrenGap: 12 }}
          enableScopedSelectors
          horizontalAlign="end"
          horizontal={true}
          className={classes.footer}
        >
          <PrimaryButton
            onClick={async () => {
              disableDiaglogButtons();
              await changeCountryContinent(
                String(props.countryId),
                formFields.continentName.value
              );
              props.onUpdateClick();
              toggleHideDialog();
              enableDiaglogButtons();
            }}
            text="Update"
            disabled={blockButton || !isFormValid}
          />
          <DefaultButton
            onClick={() => {
              toggleHideDialog();
              enableDiaglogButtons();
            }}
            text="Cancel"
            disabled={blockButton}
          />
        </Stack>
      </Modal>
    </>
  );
};

export default EditPropertyCountryContinentDetails;
