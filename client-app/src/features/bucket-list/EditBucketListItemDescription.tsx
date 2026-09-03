import React, { useEffect, useState } from "react";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import { InputField } from "../../shared/ui/forms/InputField";
import { updateBucketListItemDescription } from "./BucketListApi";
import { useBucketListClasses } from "./BucketList.styles";
import type { BucketListItem } from "./BucketList.types";

interface EditBucketListItemDescriptionProps {
  item: BucketListItem;
  onUpdated: () => void;
}

const EditBucketListItemDescription: React.FunctionComponent<
  EditBucketListItemDescriptionProps
> = ({ item, onUpdated }) => {
  const classes = useBucketListClasses();
  const [description, setDescription] = useState(item.description ?? "");

  useEffect(() => setDescription(item.description ?? ""), [item.description]);

  return (
    <EditProperty
      editIconAriaLabel={`Change description for ${item.name}`}
      text={`${item.name} description`}
      isFormValid={description.length <= 4096}
      submitErrorResetKey={description}
      contentClassName={classes.form}
      onUpdateClick={async () => {
        await updateBucketListItemDescription(item.id, {
          description: description.trim() || undefined
        });
        onUpdated();
      }}
    >
      <InputField
        label="Description"
        placeholder="How was it? What made it memorable?"
        value={description}
        maxLength={4096}
        multiline
        rows={4}
        onChange={(_event, value) => setDescription(value ?? "")}
      />
    </EditProperty>
  );
};

export default EditBucketListItemDescription;
