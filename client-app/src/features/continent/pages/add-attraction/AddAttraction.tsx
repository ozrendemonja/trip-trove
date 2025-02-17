import {
  Checkbox,
  DatePicker,
  DefaultButton,
  Dropdown,
  MaskedTextField,
  mergeStyleSets,
  PrimaryButton,
  Separator,
  Stack,
  Text,
  TextField,
  Toggle
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React from "react";
import { useNavigate } from "react-router";
import DateRangePicker from "../../../../shared/list-element/ui/date-picker/DateRangePicker";
import Navigation from "../../../../shared/navigation/Navigation";
import { SearchText } from "../../../../shared/search-text/SearchText";
import {
  AttractionType,
  CategoryType,
  SaveAttraction
} from "../../domain/Attraction.types";
import { saveNewAttraction } from "../../infra/ManagerApi";
import { useAttractionFormField } from "./AddAttraction.config";
import { useClasses } from "./AddAttraction.styles";

const categoryOptions = Object.values(CategoryType)
  .filter((x) => typeof x !== "number")
  .map((category) => ({
    key: category,
    text: category
  }));

const typeOptions = Object.values(AttractionType)
  .filter((x) => typeof x !== "number")
  .map((category) => ({
    key: category,
    text: category
  }));

export const AddAttraction: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid } = useAttractionFormField();
  const navigate = useNavigate();
  const [isCountrywide, { toggle: toggleIsCountrywide }] = useBoolean(false);
  const [isReginal, { toggle: toggleReginal }] = useBoolean(false);
  const [mustVisit, { toggle: toggleMustVisit }] = useBoolean(false);
  const [isPartOfAttraction, { toggle: togglePartOfAttraction }] =
    useBoolean(false);
  const [isTraditional, { toggle: toggleIsTraditional }] = useBoolean(false);

  const searchClass = {
    searchBox: {
      marginTop: "10px",
      boxShadow: "0"
    }
  };

  const field = {
    row: {
      marginTop: "15px"
    }
  };
  const classNew = mergeStyleSets(field);

  return (
    <>
      <Navigation />
      <Stack className={classes.root}>
        <Stack horizontal tokens={{ childrenGap: 48 }}>
          <Text as="h1" className={classes.header}>
            Add Attraction
          </Text>
        </Stack>
        <Separator></Separator>
        <Stack tokens={{ childrenGap: 48 }} horizontal={true}>
          <Text as="h1" className={classes.subHeader}>
            Country
          </Text>
          <Toggle
            className={classes.countrywide}
            label="Nationally Recognized Attraction"
            inlineLabel
            onChange={toggleIsCountrywide}
          />
        </Stack>
        <SearchText {...formFields.countryId} className={searchClass} />
        <Separator></Separator>
        <Stack tokens={{ childrenGap: 48 }} horizontal={true}>
          <Text as="h2" className={classes.subHeader}>
            {isReginal ? "Region" : "City"}
          </Text>
          <Toggle
            className={classes.countrywide}
            label="Attraction is region level"
            inlineLabel
            onChange={toggleReginal}
          />
        </Stack>
        {isReginal && (
          <>
            <SearchText {...formFields.regionId} className={searchClass} />
            <Separator></Separator>
          </>
        )}
        {!isReginal && (
          <>
            <SearchText {...formFields.cityId} className={searchClass} />
            <Separator></Separator>
          </>
        )}
        <Stack tokens={{ childrenGap: 48 }} horizontal={true}>
          <Text as="h2" className={classes.subHeader}>
            Attraction
          </Text>
          <Checkbox
            className={classes.countrywide}
            label="Must visit"
            checked={mustVisit}
            onChange={toggleMustVisit}
          />
        </Stack>
        <Stack
          tokens={{ childrenGap: 48 }}
          horizontal={true}
          className={classNew.row}
        >
          <TextField {...formFields.name} />
          <Toggle
            className={classes.inputToggle}
            label="Part of attraction"
            inlineLabel
            onChange={togglePartOfAttraction}
          />
        </Stack>
        {isPartOfAttraction && (
          <SearchText
            {...formFields.mainAttractionId}
            className={searchClass}
          />
        )}
        <Stack
          tokens={{ childrenGap: 48 }}
          horizontal={true}
          className={classNew.row}
        >
          <TextField {...formFields.address} />
          <MaskedTextField {...formFields.geoLocation} />
        </Stack>
        <Stack
          tokens={{ childrenGap: 48 }}
          horizontal={true}
          className={classNew.row}
        >
          <Dropdown {...formFields.category} options={categoryOptions} />
          <Dropdown {...formFields.type} options={typeOptions} />
        </Stack>
        <Stack
          tokens={{ childrenGap: 48 }}
          horizontal={true}
          className={classNew.row}
        >
          <Stack>
            <Text as="label">Where to visit</Text>
            <DateRangePicker {...formFields.optimalVisitPeriod} />
          </Stack>
          <Checkbox
            label="Traditional"
            checked={isTraditional}
            onChange={toggleIsTraditional}
            className={classes.countrywideMore}
          />
        </Stack>
        <TextField {...formFields.tip} className={classNew.row} />
        <Stack
          tokens={{ childrenGap: 48 }}
          horizontal={true}
          className={classNew.row}
        >
          <TextField {...formFields.source} />
          <Stack>
            <Text as="label" className={classes.countrywideMore}>
              When information comes from?
            </Text>
            <DatePicker {...formFields.sourceFrom} />
          </Stack>
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
              const attractionLocation = formFields.geoLocation?.value
                ? {
                    latitude: Number(
                      formFields.geoLocation.value.split(",")[1]
                    ),
                    longitude: Number(
                      formFields.geoLocation.value.split(",")[0]
                    )
                  }
                : undefined;

              const newAttraction: SaveAttraction = {
                isCountrywide: isCountrywide,
                regionId: formFields.regionId?.value,
                cityId: formFields.cityId?.value,
                attractionName: formFields.name.value!,
                mainAttractionId: formFields.mainAttractionId?.value,
                attractionAddress: formFields.address?.value,
                attractionLocation: attractionLocation,
                attractionCategory: formFields.category?.value!,
                attractionType: formFields.type.value!,
                mustVisit: mustVisit,
                isTraditional: isTraditional,
                tip: formFields.tip?.value,
                infoFrom: formFields.source.value!,
                infoRecorded: formFields.sourceFrom.value!.toISOString(),
                optimalVisitPeriod: {
                  fromDate: formFields.optimalVisitPeriod?.value?.from,
                  toDate: formFields.optimalVisitPeriod?.value?.to
                }
              };
              console.log("//////////////////");
              console.log(JSON.stringify(newAttraction));

              saveNewAttraction(newAttraction);
              navigate(-1);
            }}
            // disabled={!isFormValid}
            text="Save"
          />
        </Stack>
      </Stack>
    </>
  );
};

export default AddAttraction;
