import { Dropdown, IDropdownOption } from "@fluentui/react";
import { useEffect, useState } from "react";
import EditProperty from "../../../../shared/list-element/ui/edit-property/EditProperty";
import { Continent } from "../../domain/Continent.types";
import { changeCountryContinent, getContinents } from "../../infra/ManagerApi";
import { useCountryContinentFormField } from "../add-country/AddCountry.config";
import { EditRegionDetailsProps } from "./ListRegion.types";

const createOptions = (continents: Continent[]): IDropdownOption[] => {
  return continents.map((continent) => {
    return { key: continent.name, text: continent.name } as IDropdownOption;
  });
};

const EditRegionDetails: React.FunctionComponent<EditRegionDetailsProps> = (
  props
) => {
  //   const { formFields, isFormValid } = useCountryContinentFormField();
  //   const [continents, setContinents] = useState<Continent[]>([]);

  //   useEffect(() => {
  //     getContinents().then(setContinents);
  //   }, []);

  return (
    <>AAAAAAAAACCCCC</>
    // <EditProperty
    //   editIconAriaLabel={`Change continent name from ${props.text}`}
    //   text={props.text}
    //   onUpdateClick={async () => {
    //     await changeCountryContinent(
    //       String(props.countryId),
    //       formFields.continentName.value
    //     );
    //     props.onUpdateClick();
    //   }}
    //   isFormValid={isFormValid}
    // >
    //   <Dropdown
    //     {...formFields.continentName}
    //     options={createOptions(continents)}
    //   />
    // </EditProperty>
  );
};

export default EditRegionDetails;
