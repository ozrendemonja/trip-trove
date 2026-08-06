import {
  SelectChoice,
  SelectField
} from "../../../../shared/ui/forms/SelectField";
import { useEffect, useState } from "react";
import { Continent } from "../../domain/Continent.types";
import { changeCountryContinent, getContinents } from "../../infra/ManagerApi";
import { useCountryContinentFormField } from "../add-country/AddCountry.config";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { EditCountryDetailsProps } from "./ListCountry.types";

const createOptions = (continents: Continent[]): SelectChoice[] => {
  return continents.map((continent) => {
    return { value: continent.name, label: continent.name } as SelectChoice;
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
      conflictErrorMessage="A country with this name already exists in the selected continent."
      onUpdateClick={async () => {
        await changeCountryContinent(
          String(props.countryId),
          formFields.continentName.value
        );
        props.onUpdateClick();
      }}
      isFormValid={isFormValid}
    >
      <SelectField
        {...formFields.continentName}
        choices={createOptions(continents)}
      />
    </EditProperty>
  );
};

export default EditContinentDetails;
