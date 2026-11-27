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
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Select,
  Switch,
  Textarea
} from "@fluentui/react-components";
import { Add16Regular } from "@fluentui/react-icons";
import { useId, useRef, useState, type ReactElement } from "react";
import type {
  GetItineraryResponse,
  ItineraryItemFields,
  TypedItineraryEntryResponse
} from "../../clients/manager";
import { useSaveShortcut } from "../../shared/hooks/UseSaveShortcut";
import type { EntryEditError } from "./infra/ItinerarySchedulingApi";
import { useClasses } from "./Itinerary.styles";
import { ItineraryTimeZoneInput } from "./ItineraryEntryDraft";
import { TransfersToRemoveList } from "./ItineraryTransfer";
import {
  elapsedMinutes,
  isLocalClock,
  localClock,
  readPlannedMinutes
} from "./itineraryClocks";
import {
  editKind,
  type ItineraryTimingEditing
} from "./useItineraryTimingEdit";
import { usePlanningDraft } from "./useTripPlanningWorkspace";

type Day = GetItineraryResponse["days"][number];
type Kind = TypedItineraryEntryResponse["kind"];

export type ItemChoice = { trigger: HTMLButtonElement | null } & (
  | {
      action: "add-item";
      kind: Kind;
      date: string;
      dayLabel: string;
      afterEntryId?: number;
    }
  | { action: "edit-item"; item: TypedItineraryEntryResponse }
);

const mealChoices = [
  { name: "Breakfast", minutes: "30" },
  { name: "Lunch", minutes: "60" },
  { name: "Dinner", minutes: "90" }
] as const;

function suggestedMeal(clock: string): (typeof mealChoices)[number] {
  const hourAndMinute = clock.slice(0, 5);
  return mealChoices[
    hourAndMinute < "12:30" ? 0 : hourAndMinute < "16:00" ? 1 : 2
  ];
}

export function ItineraryItemMenu({
  label,
  blocked,
  showText = false,
  onChoose
}: {
  label: string;
  blocked: boolean;
  showText?: boolean;
  onChoose: (kind: Kind, trigger: HTMLButtonElement | null) => void;
}): ReactElement {
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Button
          ref={trigger}
          appearance="subtle"
          size="small"
          icon={<Add16Regular />}
          aria-label={label}
          title={label}
          disabledFocusable={blocked}
        >
          {showText ? "Add item" : undefined}
        </Button>
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem
            disabled={blocked}
            onClick={() => onChoose("MEAL", trigger.current)}
          >
            Meal...
          </MenuItem>
          <MenuItem
            disabled={blocked}
            onClick={() => onChoose("OTHER", trigger.current)}
          >
            Other item...
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
}

export function ItineraryItemDialog({
  choice,
  days,
  timeZone,
  editing,
  blocked,
  onClose,
  onSaved
}: {
  choice: ItemChoice;
  days: readonly Day[];
  timeZone?: string;
  editing: ItineraryTimingEditing;
  blocked: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}): ReactElement {
  const classes = useClasses();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const addition = choice.action === "add-item" ? choice : undefined;
  const currentItem = choice.action === "edit-item" ? choice.item : undefined;
  const kind = choice.action === "add-item" ? choice.kind : choice.item.kind;
  const day = days.find(({ date }) => date === addition?.date);
  const previous = day?.entries.find(
    ({ entryId }) => entryId === addition?.afterEntryId
  );
  const positionClock = previous?.timing.end.startsWith(`${day?.date}T`)
    ? localClock(previous.timing.end)
    : undefined;
  const initialMeal =
    addition && kind === "MEAL" && positionClock
      ? suggestedMeal(positionClock)
      : undefined;
  const [values, setValues] = useState({
    name: currentItem?.name ?? initialMeal?.name ?? "",
    minutes: currentItem
      ? String(elapsedMinutes(currentItem.timing.start, currentItem.timing.end))
      : (initialMeal?.minutes ?? ""),
    note: currentItem?.note ?? "",
    fixedStart: currentItem?.fixedStart ?? false,
    startTime: "",
    timeZone: ""
  });
  const [mealChoice, setMealChoice] = useState("");
  const [failure, setFailure] = useState<EntryEditError>();
  const { pending } = editing;
  const rejection = editing.rejections.find(
    ({ entryId, edit }) =>
      entryId === currentItem?.entryId && editKind(edit) === choice.action
  );
  const needsClock =
    addition !== undefined && addition.afterEntryId === undefined;
  const needsZone = addition !== undefined && !timeZone;
  const positionError =
    addition &&
    (!day || (needsClock ? day.entries.length > 0 : !previous)
      ? "The insertion position changed. Close this form and choose it again."
      : previous && !positionClock
        ? "The previous entry ends on another date. Choose another position or day."
        : undefined);
  const shorter = failure?.maximumPlannedMinutes;
  const minutes = readPlannedMinutes(values.minutes, 1);
  const name = values.name.trim();
  const noteError =
    values.note.length > 512
      ? "An entry note may not be longer than 512 characters."
      : undefined;
  const valid =
    !blocked &&
    !pending &&
    !positionError &&
    shorter === undefined &&
    !!name &&
    name.length <= 255 &&
    minutes !== undefined &&
    !noteError &&
    (!needsClock || isLocalClock(values.startTime)) &&
    (!needsZone || !!values.timeZone.trim()) &&
    (!(needsClock && kind === "MEAL") || !!mealChoice);
  const label = kind === "MEAL" ? "meal" : "other item";
  const title = `${addition ? "Add" : "Edit"} ${label}`;

  const cancel = (): void => {
    if (pending) return;
    editing.discardRejection(currentItem?.entryId, choice.action);
    onClose();
  };
  usePlanningDraft(true, cancel);
  useSaveShortcut(() => formRef.current?.requestSubmit());

  const update = (replacement: Partial<typeof values>): void => {
    setValues((current) => ({ ...current, ...replacement }));
    setFailure(undefined);
    editing.discardRejection(currentItem?.entryId, choice.action);
  };
  const save = (): void => {
    if (!valid || minutes === undefined) return;
    const item: ItineraryItemFields = {
      name,
      plannedMinutes: minutes,
      fixedStart: values.fixedStart,
      note: values.note || undefined
    };
    const complete: Parameters<ItineraryTimingEditing["addItem"]>[1] = (
      _saved,
      _outcome,
      applied
    ) => {
      if (applied)
        onSaved(`${name} ${addition ? "added to the itinerary" : "updated"}.`);
    };
    setFailure(undefined);
    const result = addition
      ? editing.addItem(
          {
            action: "add-item",
            previousEntryIds: new Set(
              days.flatMap(({ entries }) =>
                entries.map(({ entryId }) => entryId)
              )
            ),
            request: {
              date: addition.date,
              afterEntryId: addition.afterEntryId,
              startTime: needsClock ? values.startTime : undefined,
              timeZone: needsZone ? values.timeZone.trim() : undefined,
              kind,
              item,
              transfersToRemoveAtInsertionPoint:
                failure?.transfersToRemove?.map(({ transfer }) => transfer)
            }
          },
          complete
        )
      : currentItem &&
        editing.save(
          currentItem.entryId,
          { action: "edit-item", request: item },
          complete
        );
    void result?.then((error) => {
      if (error) setFailure(error);
    });
  };

  const transfers = failure?.transfersToRemove;
  const message =
    pending?.recovery === "unconfirmed"
      ? "The item save couldn't be confirmed. Inspect the saved itinerary before trying again."
      : pending?.recovery === "refresh"
        ? "The item was saved, but the itinerary couldn't be refreshed."
        : (positionError ?? failure?.message ?? rejection?.message);

  return (
    <Dialog open onOpenChange={(_event, { open }) => !open && cancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <form
              ref={formRef}
              id={formId}
              className={classes.noteForm}
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              {addition && (
                <Caption1>
                  {addition.dayLabel}
                  {positionClock && ` · Starts at ${positionClock}`}
                </Caption1>
              )}
              {needsClock && kind === "MEAL" && (
                <Field label="Meal" required>
                  <Select
                    value={mealChoice}
                    disabled={!!pending}
                    onChange={(_event, { value }) => {
                      setMealChoice(value);
                      const meal = mealChoices.find(
                        ({ name }) => name === value
                      );
                      update({
                        name: meal?.name ?? "",
                        minutes: meal?.minutes ?? ""
                      });
                    }}
                  >
                    <option value="">Choose a meal</option>
                    {mealChoices.map(({ name }) => (
                      <option key={name}>{name}</option>
                    ))}
                  </Select>
                </Field>
              )}
              {needsClock && (
                <Field label="Start clock" required>
                  <Input
                    type="time"
                    value={values.startTime}
                    disabled={!!pending}
                    onChange={(_event, { value }) =>
                      update({ startTime: value })
                    }
                  />
                </Field>
              )}
              {needsZone && (
                <ItineraryTimeZoneInput
                  value={values.timeZone}
                  disabled={!!pending}
                  onChange={(timeZone) => update({ timeZone })}
                />
              )}
              <Field
                label="Name"
                required
                validationMessage={
                  name.length > 255
                    ? "Enter at most 255 characters."
                    : undefined
                }
              >
                <Input
                  value={values.name}
                  disabled={!!pending}
                  onChange={(_event, { value }) => update({ name: value })}
                />
              </Field>
              <Field
                label="Planned length (minutes)"
                required
                validationMessage={
                  values.minutes && minutes === undefined
                    ? "Enter a positive whole number of minutes."
                    : undefined
                }
              >
                <Input
                  inputMode="numeric"
                  value={values.minutes}
                  disabled={!!pending}
                  onChange={(_event, { value }) => update({ minutes: value })}
                />
              </Field>
              <Switch
                label="Lock start"
                checked={values.fixedStart}
                disabled={!!pending}
                onChange={(_event, { checked }) =>
                  update({ fixedStart: checked })
                }
              />
              <Field label="Entry note" validationMessage={noteError}>
                <Textarea
                  value={values.note}
                  rows={3}
                  resize="vertical"
                  disabled={!!pending}
                  onChange={(_event, { value }) => update({ note: value })}
                />
              </Field>
              {message && (
                <MessageBar
                  intent={pending?.recovery || transfers ? "warning" : "error"}
                >
                  <MessageBarBody>
                    {message}
                    {shorter === 0 &&
                      " No positive length fits. Choose another position or change the surrounding entries."}
                  </MessageBarBody>
                </MessageBar>
              )}
              {shorter !== undefined && shorter > 0 && (
                <div>
                  <Button
                    size="small"
                    onClick={() => update({ minutes: String(shorter) })}
                  >
                    Use {shorter} minutes
                  </Button>
                  <Caption1 block>
                    Or choose another position or change the surrounding
                    entries.
                  </Caption1>
                </div>
              )}
              {transfers && <TransfersToRemoveList transfers={transfers} />}
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} disabled={!!pending}>
              Cancel
            </Button>
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
                appearance="primary"
                type="submit"
                form={formId}
                disabled={!valid}
              >
                {pending
                  ? "Saving item..."
                  : transfers
                    ? "Remove transfers and add"
                    : addition
                      ? "Add item"
                      : "Save"}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
