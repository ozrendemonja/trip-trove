import { Dropdown, IDropdownOption } from "@fluentui/react";
import { useEffect, useState } from "react";
import { Continent } from "../../domain/Continent.types";
import { changeCountryContinent, getContinents } from "../../infra/ManagerApi";
import { useCountryContinentFormField } from "../add-country/AddCountry.config";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { EditCountryDetailsProps } from "./ListCountry.types";

const createOptions = (continents: Continent[]): IDropdownOption[] => {
  return continents.map((continent) => {
    return { key: continent.name, text: continent.name } as IDropdownOption;
  });
};

const EditContinentDetails: React.FunctionComponent<EditCountryDetailsProps> = (
  props
) => {
  const { formFields, isFormValid } = useCountryContinentFormField();
  const [continents, setContinents] = useState<Continent[]>([]);

  useEffect(() => {
    getContinents().then(setContinents);
  }, []);

  return (
    <EditProperty
      editIconAriaLabel={`Change continent name from ${props.text}`}
      text={props.text}
      onUpdateClick={async () => {
        await changeCountryContinent(
          String(props.countryId),
          formFields.continentName.value
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <Dropdown
        {...formFields.continentName}
        options={createOptions(continents)}
      />
    </EditProperty>
  );
};

export default EditContinentDetails;
