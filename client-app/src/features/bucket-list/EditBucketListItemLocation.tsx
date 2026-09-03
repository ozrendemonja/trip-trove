import { Field, Radio, RadioGroup } from "@fluentui/react-components";
import React, { useState } from "react";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import { SearchText } from "../../shared/search-text/SearchText";
import { searchCity, searchRegion } from "../continent/infra/ManagerApi";
import { updateBucketListItemLocation } from "./BucketListApi";
import { useBucketListClasses } from "./BucketList.styles";
import type {
  BucketListItem,
  BucketListLocationType
} from "./BucketList.types";

interface EditBucketListItemLocationProps {
  item: BucketListItem;
  onUpdated: () => void;
}

const getLocationType = (item: BucketListItem): BucketListLocationType =>
  item.cityId != null ? "city" : item.regionId != null ? "region" : "none";

const EditBucketListItemLocation: React.FunctionComponent<
  EditBucketListItemLocationProps
> = ({ item, onUpdated }) => {
  const classes = useBucketListClasses();
  const [locationType, setLocationType] = useState(getLocationType(item));
  const [locationLabel, setLocationLabel] = useState(
    item.cityName ?? item.regionName ?? ""
  );
  const [cityId, setCityId] = useState<number | undefined>(
    item.cityId ?? undefined
  );
  const [regionId, setRegionId] = useState<number | undefined>(
    item.regionId ?? undefined
  );

  const isFormValid =
    locationType === "none" ||
    (locationType === "city" && cityId !== undefined) ||
    (locationType === "region" && regionId !== undefined);

  return (
    <EditProperty
      editIconAriaLabel={`Change bucket list item location from ${locationLabel || "anywhere"}`}
      text={locationLabel || "Anywhere"}
      isFormValid={isFormValid}
      submitErrorResetKey={`${locationType}\u0000${locationLabel}\u0000${cityId ?? ""}\u0000${regionId ?? ""}`}
      contentClassName={classes.form}
      onUpdateClick={async () => {
        await updateBucketListItemLocation(item.id, {
          cityId: locationType === "city" ? cityId : undefined,
          regionId: locationType === "region" ? regionId : undefined
        });
        onUpdated();
      }}
    >
      <Field label="Location" className={classes.locationField}>
        <RadioGroup
          className={classes.locationOptions}
          value={locationType}
          onChange={(_event, data) => {
            setLocationType(data.value as BucketListLocationType);
            setLocationLabel("");
            setCityId(undefined);
            setRegionId(undefined);
          }}
        >
          <Radio value="none" label="Anywhere" />
          <Radio value="city" label="City" />
          <Radio value="region" label="Region" />
        </RadioGroup>
      </Field>
      {locationType === "city" && (
        <SearchText
          key={`city-${item.cityId ?? "new"}`}
          label="City"
          placeholder="Type at least 3 characters"
          required
          showRequiredIndicator
          initialValue={cityId !== undefined ? locationLabel : undefined}
          getSuggestions={searchCity}
          onSelectItem={setCityId}
          onSelectValue={setLocationLabel}
          suggestionsInFlow
          className={classes.search}
        />
      )}
      {locationType === "region" && (
        <SearchText
          key={`region-${item.regionId ?? "new"}`}
          label="Region"
          placeholder="Type at least 3 characters"
          required
          showRequiredIndicator
          initialValue={regionId !== undefined ? locationLabel : undefined}
          getSuggestions={searchRegion}
          onSelectItem={setRegionId}
          onSelectValue={setLocationLabel}
          suggestionsInFlow
          className={classes.search}
        />
      )}
    </EditProperty>
  );
};

export default EditBucketListItemLocation;
