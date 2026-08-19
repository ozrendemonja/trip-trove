import {
  ComboBoxField,
  SelectField
} from "../../../../shared/ui/forms/SelectField";
import { DateInput } from "../../../../shared/ui/forms/DateInput";
import {
  InputField,
  InputFieldHandle
} from "../../../../shared/ui/forms/InputField";
import {
  Button,
  Checkbox,
  Divider,
  MessageBar,
  MessageBarBody,
  Switch,
  Text
} from "@fluentui/react-components";
import { useBooleanState } from "../../../../shared/hooks/useBooleanState";
import React, { useCallback, useRef, useState } from "react";
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
import GoogleMapsImport, { GoogleMapsImportHandle } from "./GoogleMapsImport";
import { useSaveShortcut } from "../../../../shared/hooks/UseSaveShortcut";
import { useSaveError } from "../../../../shared/hooks/UseSaveError";
import { Flex } from "../../../../shared/ui/Flex";
import { PendingButton } from "../../../../shared/ui/PendingButton";

const categoryOptions = Object.values(CategoryType)
  .filter((x) => typeof x !== "number")
  .sort((a, b) => a.localeCompare(b))
  .map((category) => ({
    value: category,
    label: category
  }));

const typeOptions = Object.values(AttractionType)
  .filter((x) => typeof x !== "number")
  .sort((a, b) => a.localeCompare(b))
  .map((category) => ({
    value: category,
    label: category
  }));

export const AddAttraction: React.FunctionComponent = () => {
  const classes = useClasses();
  const {
    formFields,
    isFormValid,
    prepareForNextSubimssion,
    applyGoogleMapsData
  } = useAttractionFormField();
  const navigate = useNavigate();
  const [isMultipleSubmissions, { toggle: toggleMultipleSubmissions }] =
    useBooleanState(false);
  const [
    isCountrywide,
    { setFalse: setNotCountrywide, toggle: toggleIsCountrywide }
  ] = useBooleanState(false);
  const [isReginal, { toggle: toggleReginal }] = useBooleanState(false);
  const [mustVisit, { setTrue: setMustVisitTrue, toggle: toggleMustVisit }] =
    useBooleanState(true);
  const [
    isPartOfAttraction,
    { setFalse: setNotPartOfAttraction, toggle: togglePartOfAttraction }
  ] = useBooleanState(false);
  const [
    isTraditional,
    { setFalse: setNonTraditional, toggle: toggleIsTraditional }
  ] = useBooleanState(false);
  const [iteration, setIteration] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const nameFieldRef = useRef<InputFieldHandle>(null);
  const addressFieldRef = useRef<InputFieldHandle>(null);
  const googleMapsImportRef = useRef<GoogleMapsImportHandle>(null);
  const { nameConflict, saveError, handleSaveError, clearSaveErrors } =
    useSaveError({
      nameConflictMessage: "An attraction with this name already exists.",
      saveErrorMessage:
        "The attraction wasn't saved. Your details are still here, so you can review or edit them and try again.",
      focusRef: nameFieldRef,
      resetKey: formFields.name.value
    });

  const handleSave = useCallback(async () => {
    if (isSaving || !isFormValid) {
      return;
    }
    const attractionLocation = formFields.geoLocation?.value
      ? {
          latitude: Number(formFields.geoLocation.value.split(",")[0]),
          longitude: Number(formFields.geoLocation.value.split(",")[1])
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
    setIsSaving(true);
    try {
      try {
        await saveNewAttraction(newAttraction);
      } catch (error) {
        handleSaveError(error);
        return;
      }

      clearSaveErrors();

      if (!isMultipleSubmissions) {
        navigate(-1);
      } else {
        const googleMapsHadValue =
          googleMapsImportRef.current?.hasValue() ?? false;
        prepareForNextSubimssion();
        setNotPartOfAttraction();
        setNotCountrywide();
        setMustVisitTrue();
        setNonTraditional();
        setIteration(iteration + 1); // Hack to force empty values to clear state
        googleMapsImportRef.current?.clear();
        if (googleMapsHadValue) {
          googleMapsImportRef.current?.focus();
        } else {
          nameFieldRef.current?.focus();
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    isFormValid,
    isSaving,
    formFields,
    isCountrywide,
    isReginal,
    mustVisit,
    isTraditional,
    isMultipleSubmissions,
    iteration,
    navigate,
    prepareForNextSubimssion,
    setNotPartOfAttraction,
    setNotCountrywide,
    setMustVisitTrue,
    setNonTraditional,
    handleSaveError,
    clearSaveErrors
  ]);

  useSaveShortcut(() => void handleSave());

  return (
    <>
      <Navigation />
      <Flex className={classes.root} data-testid="add-attraction-form">
        <Flex direction="row" gap={48}>
          <Text as="h1" className={classes.header}>
            Add Attraction
          </Text>
          <Switch
            label={
              isMultipleSubmissions
                ? "add series of attractions"
                : "add one attraction"
            }
            onChange={toggleMultipleSubmissions}
            className={classes.compactSwitch}
          />
        </Flex>
        <Divider className={classes.headerDivider} />
        <Flex className={classes.formContent}>
          <Flex gap={36} direction="row">
            <Text as="h1" className={classes.subHeader}>
              Country
            </Text>
            <Switch
              label="Nationally Recognized Attraction"
              onChange={toggleIsCountrywide}
              className={classes.sectionSwitch}
              checked={isCountrywide}
            />
          </Flex>
          <SearchText
            {...formFields.countryId}
            showRequiredIndicator
            className={classes.searchRootOverride}
            searchBoxClassName={classes.searchBoxOverride}
          />
          <Divider className={classes.sectionDivider} />
          <Flex gap={36} direction="row">
            <Text as="h2" className={classes.subHeader}>
              {isReginal ? "Region" : "City"}
            </Text>
            <Switch
              label="Attraction is region level"
              onChange={toggleReginal}
              className={classes.compactSwitch}
            />
          </Flex>
          {isReginal && (
            <>
              <SearchText
                {...formFields.regionId!}
                showRequiredIndicator
                className={classes.searchRootOverride}
                searchBoxClassName={classes.searchBoxOverride}
              />
              <Divider className={classes.attractionSectionDivider} />
            </>
          )}
          {!isReginal && (
            <>
              <SearchText
                {...formFields.cityId!}
                showRequiredIndicator
                className={classes.searchRootOverride}
                searchBoxClassName={classes.searchBoxOverride}
              />
              <Divider className={classes.attractionSectionDivider} />
            </>
          )}

          <Flex gap={48} direction="row">
            <Text as="h2" className={classes.subHeader}>
              Attraction
            </Text>
            <Checkbox
              className={classes.checkbox}
              label="Must visit"
              checked={mustVisit}
              onChange={toggleMustVisit}
            />
            <Checkbox
              label="Traditional"
              checked={isTraditional}
              onChange={toggleIsTraditional}
              className={classes.checkbox}
            />
          </Flex>
          <Flex className={classes.tip}>
            <GoogleMapsImport
              ref={googleMapsImportRef}
              onImport={(payload) => {
                applyGoogleMapsData?.(payload);
                addressFieldRef.current?.focus();
              }}
            />
          </Flex>
          <div className={`${classes.row} ${classes.nameRow}`}>
            <InputField
              {...formFields.name}
              ref={nameFieldRef}
              className={classes.attractionName}
              errorMessage={nameConflict}
              id="add-attraction-name"
              showRequiredIndicator
            />
            <Switch
              className={classes.inputToggle}
              label="Part of attraction"
              onChange={togglePartOfAttraction}
              checked={isPartOfAttraction}
            />
          </div>
          {isPartOfAttraction && (
            <Flex className={classes.row}>
              <SearchText
                {...formFields.mainAttractionId!}
                className={classes.searchRootOverride}
                searchBoxClassName={classes.searchBoxOverride}
              />
            </Flex>
          )}
          <div className={`${classes.row} ${classes.addressRow}`}>
            <InputField
              {...formFields.address}
              ref={addressFieldRef}
              className={classes.attractionName}
            />
            <InputField
              {...formFields.geoLocation}
              className={classes.geoLocation}
            />
          </div>
          <Flex gap={48} direction="row" className={classes.row}>
            <ComboBoxField
              {...formFields.category}
              choices={categoryOptions}
              className={classes.dropdowns}
              key={`Category-${iteration}`}
            />
            <SelectField
              {...formFields.type}
              choices={typeOptions}
              className={classes.dropdowns}
              key={`Type-${iteration}`}
            />
          </Flex>
          <Flex gap={48} direction="row" className={classes.whereToVisit}>
            <Flex>
              <Text as="span">Where to visit</Text>
              <DateRangePicker
                key={`DateRangePicker-${iteration}`}
                {...formFields.optimalVisitPeriod!}
              />
            </Flex>
          </Flex>
          <InputField {...formFields.tip} className={classes.tip} />
          <Flex
            gap="24px 48px"
            direction="row"
            wrap
            className={classes.informationSourceRow}
          >
            <SearchText
              {...formFields.source}
              showRequiredIndicator
              searchBoxClassName={classes.informationSourceControl}
            />
            <DateInput
              {...formFields.sourceFrom}
              className={classes.informationSourceControl}
            />
          </Flex>
        </Flex>
        {saveError && (
          <Flex className={classes.saveError}>
            <MessageBar intent="error">
              <MessageBarBody>{saveError}</MessageBarBody>
            </MessageBar>
          </Flex>
        )}
        <Flex
          direction="row"
          justify="flex-end"
          className={classes.footer}
          gap={12}
        >
          <Button
            appearance="secondary"
            onClick={() => navigate(-1)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <PendingButton
            appearance="primary"
            pending={isSaving}
            pendingText="Saving..."
            onClick={() => void handleSave()}
            disabled={!isFormValid}
          >
            Save
          </PendingButton>
        </Flex>
      </Flex>
    </>
  );
};

export default AddAttraction;
