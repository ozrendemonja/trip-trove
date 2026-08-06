import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle
} from "@fluentui/react-components";
import { Prohibited16Regular } from "@fluentui/react-icons";
import React, { useState } from "react";
import "./PermanentlyClosedStatus.css";

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
    <Button
      appearance="subtle"
      className={`permanently-closed-status ${isClosed ? "is-closed" : "is-open"}`}
      icon={<Prohibited16Regular />}
      title={statusLabel}
      aria-label={statusLabel}
      onClick={() => setDialogOpen(true)}
    />
  ) : isClosed ? (
    <span
      className="permanently-closed-status is-closed"
      title={statusLabel}
      role="img"
      aria-label={statusLabel}
    >
      <Prohibited16Regular aria-hidden="true" />
    </span>
  ) : null;

  return (
    <>
      {status}
      {onChange && (
        <Dialog
          open={dialogOpen}
          modalType="alert"
          onOpenChange={(_event, data) => {
            if (!data.open) {
              setDialogOpen(false);
            }
          }}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>
                {isClosed
                  ? "Reopen this attraction?"
                  : "Mark as permanently closed?"}
              </DialogTitle>
              <DialogContent>
                {isClosed
                  ? `${attractionName} will return to the column suggested by its visit history.`
                  : `${attractionName} will move to Excluded Attractions and stay there in future trip plans.`}
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="primary"
                  className={isClosed ? undefined : "closure-dialog-confirm"}
                  onClick={() => {
                    onChange(!isClosed);
                    setDialogOpen(false);
                  }}
                >
                  {isClosed ? "Reopen attraction" : "Mark permanently closed"}
                </Button>
                <Button
                  appearance="secondary"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}
    </>
  );
};

export default PermanentlyClosedStatus;
