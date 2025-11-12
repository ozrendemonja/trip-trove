import {
  Checkbox,
  ComboBox,
  DatePicker,
  DefaultButton,
  Dropdown,
  PrimaryButton,
  Separator,
  Stack,
  Text,
  TextField,
  Toggle
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { useState } from "react";
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
import { searchOverride, useClasses } from "./AddAttraction.styles";

const categoryOptions = Object.values(CategoryType)
  .filter((x) => typeof x !== "number")
  .sort((a, b) => a.localeCompare(b))
  .map((category) => ({
    key: category,
    text: category
  }));

const typeOptions = Object.values(AttractionType)
  .filter((x) => typeof x !== "number")
  .sort((a, b) => a.localeCompare(b))
  .map((category) => ({
    key: category,
    text: category
  }));

export const AddAttraction: React.FunctionComponent = () => {
  const classes = useClasses();
  const { formFields, isFormValid, prepareForNextSubimssion } =
    useAttractionFormField();
  const navigate = useNavigate();
  const [isMultipleSubmissions, { toggle: toggleMultipleSubmissions }] =
    useBoolean(false);
  const [
    isCountrywide,
    { setFalse: setNotCountrywide, toggle: toggleIsCountrywide }
  ] = useBoolean(false);
  const [isReginal, { toggle: toggleReginal }] = useBoolean(false);
  const [mustVisit, { setFalse: setOptionalVisit, toggle: toggleMustVisit }] =
    useBoolean(false);
  const [
    isPartOfAttraction,
    { setFalse: setNotPartOfAttraction, toggle: togglePartOfAttraction }
  ] = useBoolean(false);
  const [
    isTraditional,
    { setFalse: setNonTraditional, toggle: toggleIsTraditional }
  ] = useBoolean(false);
  const [iteration, setIteration] = useState<number>(0);

  return (
    <>
      <Navigation />
      <Stack className={classes.root}>
        <Stack horizontal tokens={{ childrenGap: 48 }}>
          <Text as="h1" className={classes.header}>
            Add Attraction
          </Text>
          <Toggle
            className={classes.checkbox}
            label={
              isMultipleSubmissions
                ? "add series of attractions"
                : "add one attraction"
            }
            inlineLabel
            onChange={toggleMultipleSubmissions}
            styles={{ root: { marginTop: 5 } }}
          />
        </Stack>
        <Separator></Separator>
        <Stack styles={{ root: { marginLeft: "25px" } }}>
          <Stack tokens={{ childrenGap: 36 }} horizontal={true}>
            <Text as="h1" className={classes.subHeader}>
              Country
            </Text>
            <Toggle
              className={classes.checkbox}
              label="Nationally Recognized Attraction"
              inlineLabel
              onChange={toggleIsCountrywide}
              styles={{ root: { marginTop: 10 } }}
              checked={isCountrywide}
            />
          </Stack>
          <SearchText {...formFields.countryId} className={searchOverride} />
          <Separator></Separator>
          <Stack tokens={{ childrenGap: 36 }} horizontal={true}>
            <Text as="h2" className={classes.subHeader}>
              {isReginal ? "Region" : "City"}
            </Text>
            <Toggle
              className={classes.checkbox}
              label="Attraction is region level"
              inlineLabel
              onChange={toggleReginal}
              styles={{ root: { marginTop: 5 } }}
            />
          </Stack>
          {isReginal && (
            <>
              <SearchText {...formFields.regionId} className={searchOverride} />
              <Separator></Separator>
            </>
          )}
          {!isReginal && (
            <>
              <SearchText {...formFields.cityId} className={searchOverride} />
              <Separator></Separator>
            </>
          )}

          <Stack tokens={{ childrenGap: 48 }} horizontal={true}>
            <Text as="h2" className={classes.subHeader}>
              Attraction
            </Text>
            <Checkbox
              className={classes.checkbox}
              label="Must visit"
              checked={mustVisit}
              onChange={toggleMustVisit}
            />
          </Stack>
          <Stack
            tokens={{ childrenGap: 48 }}
            horizontal={true}
            className={classes.row}
          >
            <TextField
              {...formFields.name}
              className={classes.attractionName}
            />
            <Toggle
              className={classes.inputToggle}
              label="Part of attraction"
              inlineLabel
              onChange={togglePartOfAttraction}
              checked={isPartOfAttraction}
            />
          </Stack>
          {isPartOfAttraction && (
            <SearchText
              {...formFields.mainAttractionId}
              className={searchOverride}
            />
          )}
          <Stack
            tokens={{ childrenGap: 48 }}
            horizontal={true}
            className={classes.row}
          >
            <TextField
              {...formFields.address}
              className={classes.attractionName}
            />
            <TextField {...formFields.geoLocation} />
          </Stack>
          <Stack
            tokens={{ childrenGap: 48 }}
            horizontal={true}
            className={classes.row}
          >
            <ComboBox
              {...formFields.category}
              options={categoryOptions}
              className={classes.dropdowns}
              autoComplete={"on"}
              key={`Category-${iteration}`}
            />
            <Dropdown
              {...formFields.type}
              options={typeOptions}
              className={classes.dropdowns}
              defaultSelectedKeys={undefined}
              key={`Type-${iteration}`}
            />
          </Stack>
          <Stack
            tokens={{ childrenGap: 48 }}
            horizontal={true}
            className={classes.whereToVisit}
          >
            <Stack>
              <Text as="label">Where to visit</Text>
              <DateRangePicker
                key={`DateRangePicker-${iteration}`}
                {...formFields.optimalVisitPeriod}
              />
            </Stack>
            <Checkbox
              label="Traditional"
              checked={isTraditional}
              onChange={toggleIsTraditional}
              className={classes.checkbox}
              styles={{ root: { marginTop: "24px" } }}
            />
          </Stack>
          <TextField {...formFields.tip} className={classes.tip} />
          <Stack
            tokens={{ childrenGap: 48 }}
            horizontal={true}
            className={classes.tip}
          >
            <TextField {...formFields.source} />
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
                      formFields.geoLocation.value.split(",")[0]
                    ),
                    longitude: Number(
                      formFields.geoLocation.value.split(",")[1]
                    )
                  }
                : undefined;

              const optimalVisitPeriod = formFields.optimalVisitPeriod?.value
                ? {
                    fromDate: formFields.optimalVisitPeriod?.value?.from,
                    toDate: formFields.optimalVisitPeriod?.value?.to
                  }
                : undefined;

              const newAttraction: SaveAttraction = {
                isCountrywide: isCountrywide,
                regionId: isReginal ? formFields.regionId?.value : undefined,
                cityId: !isReginal ? formFields.cityId?.value : undefined,
                attractionName: formFields.name.value!.trimStart(),
                mainAttractionId: formFields.mainAttractionId?.value,
                attractionAddress:
                  formFields.address?.value?.trimStart() === ""
                    ? undefined
                    : formFields.address?.value,
                attractionLocation: attractionLocation,
                attractionCategory: formFields.category?.value,
                attractionType: formFields.type.value,
                mustVisit: mustVisit,
                isTraditional: isTraditional,
                tip:
                  formFields.tip?.value?.trimStart() === ""
                    ? undefined
                    : formFields.tip?.value,
                infoFrom: formFields.source.value!,
                infoRecorded: formFields.sourceFrom.value!.toISOString(),
                optimalVisitPeriod: optimalVisitPeriod
              };
              saveNewAttraction(newAttraction);

              if (!isMultipleSubmissions) {
                navigate(-1);
              } else {
                prepareForNextSubimssion();
                setNotPartOfAttraction();
                setNotCountrywide();
                setOptionalVisit();
                setNonTraditional();
                setIteration(iteration + 1); // Hack to force empty values to clear state
              }
            }}
            disabled={!isFormValid}
            text="Save"
          />
        </Stack>
      </Stack>
    </>
  );
};

export default AddAttraction;
