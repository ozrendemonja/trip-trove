import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  Icon,
  IconButton,
  initializeIcons,
  PrimaryButton
} from "@fluentui/react";
import React, { useState } from "react";
import "./PermanentlyClosedStatus.css";

initializeIcons();

interface PermanentlyClosedStatusProps {
  attractionName: string;
  closedAt?: string;
  onChange?: (isClosed: boolean) => void;
}

interface PermanentlyClosedSinceProps {
  closedAt?: string;
}

const formatClosedDate = (closedAt?: string): string | undefined => {
  if (!closedAt) return undefined;

  const closedDate = new Date(closedAt);
  return Number.isNaN(closedDate.getTime())
    ? undefined
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        closedDate
      );
};

export const PermanentlyClosedSince: React.FC<PermanentlyClosedSinceProps> = ({
  closedAt
}) => {
  const formattedClosedDate = formatClosedDate(closedAt);

  return formattedClosedDate ? (
    <span className="permanently-closed-since">
      Permanently closed since {formattedClosedDate}
    </span>
  ) : null;
};

const PermanentlyClosedStatus: React.FC<PermanentlyClosedStatusProps> = ({
  attractionName,
  closedAt,
  onChange
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isClosed = !!closedAt;
  const formattedClosedDate = formatClosedDate(closedAt);
  const statusLabel = isClosed
    ? `${attractionName} is permanently closed${formattedClosedDate ? ` since ${formattedClosedDate}` : ""}`
    : `Mark ${attractionName} as permanently closed`;

  const status = onChange ? (
    <IconButton
      className={`permanently-closed-status ${isClosed ? "is-closed" : "is-open"}`}
      iconProps={{ iconName: "ChromeClose" }}
      title={statusLabel}
      ariaLabel={statusLabel}
      onClick={() => setDialogOpen(true)}
    />
  ) : isClosed ? (
    <span
      className="permanently-closed-status is-closed"
      title={statusLabel}
      role="img"
      aria-label={statusLabel}
    >
      <Icon iconName="ChromeClose" aria-hidden="true" />
    </span>
  ) : null;

  return (
    <>
      {status}
      {onChange && (
        <Dialog
          hidden={!dialogOpen}
          onDismiss={() => setDialogOpen(false)}
          dialogContentProps={{
            type: DialogType.normal,
            title: isClosed
              ? "Reopen this attraction?"
              : "Mark as permanently closed?",
            subText: isClosed
              ? `${attractionName} will return to the column suggested by its visit history.`
              : `${attractionName} will move to Excluded Attractions and stay there in future trip plans.`
          }}
          modalProps={{ isBlocking: true }}
        >
          <DialogFooter>
            <PrimaryButton
              className={isClosed ? undefined : "closure-dialog-confirm"}
              text={isClosed ? "Reopen attraction" : "Mark permanently closed"}
              onClick={() => {
                onChange(!isClosed);
                setDialogOpen(false);
              }}
            />
            <DefaultButton text="Cancel" onClick={() => setDialogOpen(false)} />
          </DialogFooter>
        </Dialog>
      )}
    </>
  );
};

export default PermanentlyClosedStatus;
