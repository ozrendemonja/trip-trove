import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Select
} from "@fluentui/react-components";
import { MoreHorizontal16Regular } from "@fluentui/react-icons";
import { useRef, useState, type ReactElement } from "react";
import type {
  GetItineraryResponse,
  MoveItineraryEntryRequest
} from "../../clients/manager";
import { useClasses } from "./Itinerary.styles";
import { localClock } from "./itineraryClocks";
import { usePlanningDraft } from "./useTripPlanningWorkspace";

type Day = GetItineraryResponse["days"][number];
type Entry = Day["entries"][number];

export function ItineraryEntryActions({
  entry,
  day,
  index,
  days,
  blocked,
  formatDate,
  onMove,
  onRemove
}: {
  entry: Entry;
  day: Day;
  index: number;
  days: readonly Day[];
  blocked: boolean;
  formatDate: (date: string) => string;
  onMove: (position: MoveItineraryEntryRequest) => void;
  onRemove: () => void;
}): ReactElement {
  const classes = useClasses();
  const menuButton = useRef<HTMLButtonElement>(null);
  const [dialog, setDialog] = useState<"move" | "remove">();
  const [destination, setDestination] = useState("");
  const [beforeEntryId, setBeforeEntryId] = useState<number>();
  const destinationDay = days.find(
    (candidate) => candidate.date === destination
  );
  const selectDefaultPosition = (date: string): void => {
    setDestination(date);
    setBeforeEntryId(
      date === day.date ? day.entries[index + 1]?.entryId : undefined
    );
  };
  const close = (): void => {
    setDialog(undefined);
    menuButton.current?.focus();
  };
  usePlanningDraft(dialog !== undefined, close);

  return (
    <>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button
            ref={menuButton}
            appearance="subtle"
            size="small"
            icon={<MoreHorizontal16Regular />}
            aria-label={`Actions for ${entry.name}`}
            disabledFocusable={blocked}
          />
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem
              disabled={index === 0 || blocked}
              onClick={() =>
                onMove({
                  date: day.date,
                  beforeEntryId: day.entries[index - 1]?.entryId
                })
              }
            >
              Move up
            </MenuItem>
            <MenuItem
              disabled={index === day.entries.length - 1 || blocked}
              onClick={() =>
                onMove({
                  date: day.date,
                  beforeEntryId: day.entries[index + 2]?.entryId
                })
              }
            >
              Move down
            </MenuItem>
            <MenuItem
              disabled={blocked}
              onClick={() => {
                selectDefaultPosition(
                  days.find((candidate) => candidate.date !== day.date)?.date ??
                    day.date
                );
                setDialog("move");
              }}
            >
              Move to day...
            </MenuItem>
            <MenuItem
              disabled={blocked || !!entry.groupedAttractions?.length}
              title={
                entry.groupedAttractions?.length
                  ? "Removing a grouped entry is not available yet."
                  : undefined
              }
              onClick={() => setDialog("remove")}
            >
              Remove from itinerary
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <Dialog
        open={dialog !== undefined}
        onOpenChange={(_event, data) => {
          if (!data.open) close();
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {dialog === "move"
                ? `Move ${entry.name} to day`
                : `Remove ${entry.name}?`}
            </DialogTitle>
            <DialogContent className={classes.positionFields}>
              {dialog === "move" ? (
                <>
                  <Field label="Day">
                    <Select
                      value={destination}
                      onChange={(_event, { value }) =>
                        selectDefaultPosition(value)
                      }
                    >
                      {days.map(({ date }) => (
                        <option key={date} value={date}>
                          {formatDate(date)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Position">
                    <Select
                      value={beforeEntryId ?? ""}
                      onChange={(_event, { value }) =>
                        setBeforeEntryId(value ? Number(value) : undefined)
                      }
                    >
                      <option value="">End of day</option>
                      {destinationDay?.entries
                        .filter((item) => item.entryId !== entry.entryId)
                        .map(({ entryId, name }) => (
                          <option key={entryId} value={entryId}>
                            Before {name}
                          </option>
                        ))}
                    </Select>
                  </Field>
                </>
              ) : (
                <>The attraction stays on your trip board.</>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={close}>
                Cancel
              </Button>
              {dialog === "move" ? (
                <Button
                  appearance="primary"
                  disabled={blocked || !destinationDay}
                  onClick={() => {
                    close();
                    onMove({ date: destination, beforeEntryId });
                  }}
                >
                  Move entry
                </Button>
              ) : (
                <Button
                  appearance="primary"
                  disabled={blocked}
                  onClick={() => {
                    close();
                    onRemove();
                  }}
                >
                  Remove entry
                </Button>
              )}
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}

export function MoveStartChoice({
  entry,
  offsets,
  onChoose,
  onCancel
}: {
  entry: Entry;
  offsets: readonly string[];
  onChoose: (offset: string) => void;
  onCancel: () => void;
}): ReactElement {
  return (
    <Dialog
      open
      onOpenChange={(_event, data) => {
        if (!data.open) onCancel();
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Choose a start for {entry.name}</DialogTitle>
          <DialogContent>
            This start clock occurs twice. Both times fit the chosen position.
          </DialogContent>
          <DialogActions>
            <Button onClick={onCancel}>Cancel</Button>
            {offsets.map((offset) => (
              <Button key={offset} onClick={() => onChoose(offset)}>
                {localClock(entry.timing.start)} UTC
                {offset === "Z" ? "+00:00" : offset}
              </Button>
            ))}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
