import {
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Select,
  Text,
  Textarea,
  useId
} from "@fluentui/react-components";
import {
  Airplane20Regular,
  PersonWalking20Regular,
  VehicleBus20Regular,
  VehicleCableCar20Regular,
  VehicleCar20Regular,
  VehicleShip20Regular,
  VehicleSubway20Regular,
  VehicleSubwayClock20Regular,
  Warning16Regular
} from "@fluentui/react-icons";
import { useRef, useState, type ReactElement } from "react";
import type {
  ItineraryTransferDto,
  ItineraryTransferRemovalResponse,
  UpdateItineraryTransferRequest
} from "../../clients/manager";
import { useSaveShortcut } from "../../shared/hooks/UseSaveShortcut";
import { useClasses } from "./Itinerary.styles";
import type { ItineraryEntry } from "./itineraryEntries";
import type { ItineraryTimingEditing } from "./useItineraryTimingEdit";

type Mode = ItineraryTransferDto["mode"];

const modes = {
  WALKING: { label: "Walking", Icon: PersonWalking20Regular },
  METRO: { label: "Metro", Icon: VehicleSubwayClock20Regular },
  BUS: { label: "Bus", Icon: VehicleBus20Regular },
  TRAM: { label: "Tram", Icon: VehicleCableCar20Regular },
  TRAIN: { label: "Train", Icon: VehicleSubway20Regular },
  CAR: { label: "Car", Icon: VehicleCar20Regular },
  BOAT: { label: "Boat", Icon: VehicleShip20Regular },
  FLIGHT: { label: "Flight", Icon: Airplane20Regular }
} satisfies Record<
  Mode,
  { label: string; Icon: typeof PersonWalking20Regular }
>;

const isMode = (value: string): value is Mode => Object.hasOwn(modes, value);

const transferLabel = ({ mode, minutes }: ItineraryTransferDto): string =>
  `${modes[mode].label} · ${minutes}m`;

export function transfersForEntryRemoval(
  entries: ItineraryEntry[],
  index: number
): ItineraryTransferRemovalResponse[] {
  const fromAndTo = [
    [entries[index - 1], entries[index]],
    [entries[index], entries[index + 1]]
  ];
  return fromAndTo.flatMap(([from, to]) => {
    const removal = transferBetweenEntries(from, to);
    return removal ? [removal] : [];
  });
}

export function transferBetweenEntries(
  from?: ItineraryEntry,
  to?: ItineraryEntry
): ItineraryTransferRemovalResponse | undefined {
  const transfer = from?.outgoingTransfer;
  return transfer && to && transfer.toEntryId === to.entryId
    ? { transfer, fromName: from.name, toName: to.name }
    : undefined;
}

export function TransferLine({
  from,
  to,
  blocked,
  onEdit
}: {
  from: ItineraryEntry;
  to: ItineraryEntry;
  blocked: boolean;
  onEdit: (trigger: HTMLButtonElement) => void;
}): ReactElement {
  const classes = useClasses();
  const transfer = from.outgoingTransfer;
  const Icon = transfer ? modes[transfer.mode].Icon : Warning16Regular;
  return (
    <Button
      appearance="subtle"
      size="small"
      className={classes.transferLine}
      icon={<Icon />}
      aria-haspopup="dialog"
      aria-label={`${transfer ? "Edit" : "Add"} transfer from ${from.name} to ${to.name}`}
      aria-description={transfer ? transferLabel(transfer) : undefined}
      disabledFocusable={blocked}
      onClick={({ currentTarget }) => onEdit(currentTarget)}
    >
      {transfer ? transferLabel(transfer) : "Missing transfer"}
    </Button>
  );
}

export function TransferEditor({
  from,
  to,
  editing,
  onClose,
  onSaved
}: {
  from: ItineraryEntry;
  to: ItineraryEntry;
  editing: ItineraryTimingEditing;
  onClose: () => void;
  onSaved: (message: string) => void;
}): ReactElement {
  const classes = useClasses();
  const title = `Transfer from ${from.name} to ${to.name}`;
  const existing = from.outgoingTransfer;
  const [mode, setMode] = useState<Mode | undefined>(existing?.mode);
  const [minutes, setMinutes] = useState(existing?.minutes.toString() ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const formId = useId("transfer-form");
  const form = useRef<HTMLFormElement>(null);
  const { pending, rejections } = editing;
  const canClose = !pending?.activity && pending?.recovery !== "unconfirmed";
  const [saveError, setSaveError] = useState<string>();
  const message =
    rejections.find(
      ({ entryId, edit }) =>
        entryId === from.entryId &&
        "action" in edit &&
        edit.action === "transfer"
    )?.message ?? saveError;
  const minutesValid =
    /^\d+$/.test(minutes) && Number(minutes) <= 2_147_483_647;
  const valid = !!mode && minutesValid && note.length <= 512;
  useSaveShortcut(() => form.current?.requestSubmit(), !pending);

  const save = (transfer?: UpdateItineraryTransferRequest): void => {
    setSaveError(undefined);
    void editing
      .save(
        from.entryId,
        { action: "transfer", toEntryId: to.entryId, transfer },
        (_saved, _recovery, applied) => {
          if (!applied) return;
          onSaved(`${title} ${transfer ? "saved" : "removed"}.`);
          onClose();
        }
      )
      .then((error) => setSaveError(error?.message));
  };

  return (
    <Dialog
      open
      onOpenChange={(_event, { open }) => !open && canClose && onClose()}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <form
              ref={form}
              id={formId}
              className={classes.noteForm}
              onSubmit={(event) => {
                event.preventDefault();
                if (!valid || !mode || pending) return;
                save({
                  mode,
                  minutes: Number(minutes),
                  note: note || undefined
                });
              }}
            >
              <Field label="Mode" required>
                <Select
                  value={mode ?? ""}
                  disabled={!!pending}
                  onChange={(_event, { value }) =>
                    setMode(isMode(value) ? value : undefined)
                  }
                >
                  <option value="">Choose a mode</option>
                  {Object.entries(modes).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Minutes"
                required
                validationMessage={
                  minutes && !minutesValid
                    ? "Enter non-negative whole minutes."
                    : undefined
                }
              >
                <Input
                  inputMode="numeric"
                  value={minutes}
                  disabled={!!pending}
                  onChange={(_event, { value }) => setMinutes(value)}
                />
              </Field>
              <Field
                label="Transfer note"
                validationMessage={
                  note.length > 512
                    ? "A transfer note may not exceed 512 characters."
                    : undefined
                }
              >
                <Textarea
                  value={note}
                  disabled={!!pending}
                  resize="vertical"
                  onChange={(_event, { value }) => setNote(value)}
                />
              </Field>
            </form>
            {pending?.recovery && (
              <MessageBar intent="warning">
                <MessageBarBody>
                  {pending.recovery === "unconfirmed"
                    ? "The transfer save couldn't be confirmed. Inspect the saved itinerary before trying again."
                    : "The transfer was saved, but the itinerary couldn't be refreshed."}
                </MessageBarBody>
              </MessageBar>
            )}
            {message && (
              <MessageBar intent="error">
                <MessageBarBody>{message}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={!canClose}>
              {pending?.recovery === "refresh" ? "Close" : "Cancel"}
            </Button>
            {existing && !pending && (
              <Button onClick={() => save()}>Remove transfer</Button>
            )}
            {pending?.recovery ? (
              <Button
                appearance="primary"
                disabled={!!pending.activity}
                onClick={() => void editing.inspect()}
              >
                Inspect saved itinerary
              </Button>
            ) : (
              <Button
                type="submit"
                form={formId}
                appearance="primary"
                disabled={!valid || !!pending}
              >
                {pending ? "Saving transfer..." : "Save transfer"}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

export function TransfersToRemoveList({
  transfers
}: {
  transfers: ItineraryTransferRemovalResponse[];
}): ReactElement {
  return (
    <ul aria-label="Transfers to remove">
      {transfers.map(({ fromName, toName, transfer }) => (
        <li key={`${transfer.fromEntryId}:${transfer.toEntryId}`}>
          <Text weight="semibold">{`${fromName} to ${toName}`}</Text>
          <Caption1 block>{transferLabel(transfer)}</Caption1>
          {transfer.note && <Caption1 block>{transfer.note}</Caption1>}
        </li>
      ))}
    </ul>
  );
}

export function TransfersToRemoveDialog({
  transfers,
  scheduling,
  blocked,
  onCancel,
  onConfirm
}: {
  transfers: ItineraryTransferRemovalResponse[];
  scheduling?: boolean;
  blocked: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}): ReactElement {
  return (
    <Dialog
      open
      modalType="alert"
      onOpenChange={(_event, { open }) => !open && onCancel()}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {transfers.length
              ? "Remove disconnected transfers?"
              : "Review the changed transfer consequences"}
          </DialogTitle>
          <DialogContent>
            {transfers.length ? (
              <>
                <p>This change would remove the following transfers:</p>
                <TransfersToRemoveList transfers={transfers} />
              </>
            ) : (
              <p>No transfers would be removed now.</p>
            )}
            {scheduling && (
              <p>
                Your chosen start and the saved entry clocks will not change.
              </p>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onCancel}>Cancel</Button>
            <Button appearance="primary" disabled={blocked} onClick={onConfirm}>
              {scheduling ? "Confirm and add to day" : "Confirm change"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
