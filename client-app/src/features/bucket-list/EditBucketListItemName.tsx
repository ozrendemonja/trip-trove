import React, { useEffect, useState } from "react";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import { InputField } from "../../shared/ui/forms/InputField";
import { updateBucketListItemName } from "./BucketListApi";
import type { BucketListItem } from "./BucketList.types";

interface EditBucketListItemNameProps {
  item: BucketListItem;
  onUpdated: () => void;
}

const EditBucketListItemName: React.FunctionComponent<
  EditBucketListItemNameProps
> = ({ item, onUpdated }) => {
  const [name, setName] = useState(item.name);
  const trimmedName = name.trim();

  useEffect(() => setName(item.name), [item.name]);

  return (
    <EditProperty
      editIconAriaLabel={`Change bucket list item name from ${item.name}`}
      text={item.name}
      isFormValid={trimmedName.length > 0 && name.length <= 256}
      submitErrorResetKey={name}
      onUpdateClick={async () => {
        await updateBucketListItemName(item.id, { name: trimmedName });
        onUpdated();
      }}
    >
      <InputField
        label="Name"
        value={name}
        maxLength={256}
        required
        showRequiredIndicator
        onChange={(_event, value) => setName(value ?? "")}
      />
    </EditProperty>
  );
};

export default EditBucketListItemName;
