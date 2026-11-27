import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarBody,
  Spinner
} from "@fluentui/react-components";
import type { ReactElement } from "react";
import { useConfirmDeleteDialogStyles } from "../../../shared/list-element/ui/delete-dialog/DeleteDialog.styles";
import { formatItineraryDate } from "../../my-trip/Itinerary";
import { TransfersToRemoveList } from "../../my-trip/ItineraryTransfer";
import { clockOffset, localClock } from "../../my-trip/itineraryClocks";
import type { BoardRemovalPreview } from "./useBoardRemovalPreview";

const clockLabel = (time: string, repeated: boolean | undefined): string =>
  `${localClock(time)}${repeated ? ` (${clockOffset(time)})` : ""}`;

export function BoardRemovalDialog({
  preview,
  prepare,
  onClose,
  onRetry
}: {
  preview: BoardRemovalPreview;
  prepare: boolean;
  onClose: () => void;
  onRetry: () => void;
}): ReactElement {
  const styles = useConfirmDeleteDialogStyles();
  const { proposal, state } = preview;
  const city = proposal.operation === "city";
  const exclude = proposal.operation === "exclude";
  const selection = state === "ready" ? preview.selection : undefined;
  const entry = selection?.entry;
  const target = city
    ? `all unscheduled attractions in ${proposal.name}`
    : proposal.name;
  const title = exclude
    ? `Move ${proposal.name} to Excluded Attractions?`
    : `Delete ${target}`;
  const start = entry?.saved.timing.start;
  const end = entry?.saved.timing.end;

  return (
    <Dialog
      open
      modalType="alert"
      onOpenChange={(_event, data) => {
        if (!data.open) onClose();
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            {state === "loading" && <Spinner label="Checking the itinerary" />}
            {state === "error" && (
              <MessageBar intent="error">
                <MessageBarBody>{preview.message}</MessageBarBody>
              </MessageBar>
            )}
            {selection && (
              <>
                {city ? (
                  <p>
                    {selection.attractionIds.length > 0
                      ? `Remove all unscheduled attractions from ${proposal.name}?`
                      : `There are no unscheduled attractions to remove in ${proposal.name}.`}
                    {" Scheduled attractions will stay."}
                  </p>
                ) : (
                  !exclude && <p>{`Remove ${proposal.name} from the trip?`}</p>
                )}
                {entry && start && end && (
                  <>
                    <p>
                      {prepare
                        ? "Saving this change will also remove this itinerary entry:"
                        : "This will also remove this itinerary entry:"}
                    </p>
                    <ul>
                      <li>
                        {`Day ${entry.dayNumber} (${formatItineraryDate(start.slice(0, 10))}), ${clockLabel(start, entry.saved.timing.repeatedStart)} to `}
                        {start.slice(0, 10) !== end.slice(0, 10) &&
                          `${entry.endDayNumber ? `Day ${entry.endDayNumber} ` : ""}(${formatItineraryDate(end.slice(0, 10))}), `}
                        {clockLabel(end, entry.saved.timing.repeatedEnd)}
                        {entry.saved.fixedStart && " (fixed start)"}
                      </li>
                    </ul>
                    {entry.transfers.length > 0 && (
                      <>
                        <p>These transfers will also be removed:</p>
                        <TransfersToRemoveList transfers={entry.transfers} />
                      </>
                    )}
                  </>
                )}
                {proposal.reviewAgain && !entry && (
                  <p>This attraction is no longer scheduled.</p>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            {state === "error" && (
              <Button onClick={onRetry}>Reload itinerary preview</Button>
            )}
            {!!selection?.attractionIds.length && (
              <Button
                appearance="primary"
                className={entry || !exclude ? styles.deleteButton : undefined}
                onClick={() => {
                  onClose();
                  proposal.apply(selection);
                }}
              >
                {exclude ? "Move to Excluded" : "Delete"}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
