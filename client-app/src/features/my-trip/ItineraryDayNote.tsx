import {
  Button,
  Caption1,
  Caption1Strong,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  MessageBar,
  MessageBarBody,
  Textarea,
  mergeClasses,
  useId
} from "@fluentui/react-components";
import {
  Add16Regular,
  ArrowClockwise16Regular,
  Edit16Regular
} from "@fluentui/react-icons";
import { useRef, type ReactElement } from "react";
import { useSaveShortcut } from "../../shared/hooks/UseSaveShortcut";
import "../AI-table/styles/AttractionItem.css";
import { useClasses } from "./Itinerary.styles";
import { MarkedPlanningChange } from "./MarkedPlanningChange";
import {
  dayNoteField,
  dayNoteLengthError,
  type useItineraryDayNotes
} from "./useItineraryDayNotes";

export function ItineraryDayNote({
  subject,
  value,
  blocked,
  saved,
  onEdit
}: {
  subject: string;
  value?: string;
  blocked: boolean;
  saved: boolean;
  onEdit: (trigger: HTMLButtonElement) => void;
}): ReactElement {
  const classes = useClasses();
  const { label } = dayNoteField;
  return (
    <div className={classes.noteControl}>
      {value && (
        <div
          role="note"
          aria-label={label}
          className={mergeClasses("sticky-note", classes.note)}
        >
          <Caption1Strong block>{label}</Caption1Strong>
          <Caption1 block className={classes.notePreview}>
            {value}
          </Caption1>
        </div>
      )}
      <Button
        appearance="subtle"
        size="small"
        icon={value ? <Edit16Regular /> : <Add16Regular />}
        disabledFocusable={blocked}
        aria-haspopup="dialog"
        aria-description={subject}
        onClick={({ currentTarget }) => onEdit(currentTarget)}
      >
        {value ? "Edit day note" : "Add day note"}
      </Button>
      {saved && (
        <MarkedPlanningChange
          feedback={{
            state: "saved",
            proposal: {
              subjectName: `${label} for ${subject}`,
              description: value ? `${label} updated` : `${label} cleared`
            }
          }}
        />
      )}
    </div>
  );
}

export function DayNoteEditor({
  editing
}: {
  editing: ReturnType<typeof useItineraryDayNotes>;
}): ReactElement | null {
  const classes = useClasses();
  const formId = useId("itinerary-note");
  const form = useRef<HTMLFormElement>(null);
  const { draft, cancel, save, update, inspect } = editing;
  useSaveShortcut(() => form.current?.requestSubmit(), !!draft);
  if (!draft) return null;

  const lengthError = dayNoteLengthError(draft.text);
  return (
    <Dialog open onOpenChange={(_event, { open }) => !open && cancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Edit day note</DialogTitle>
          <DialogContent className={classes.noteForm}>
            <Caption1>{draft.subject}</Caption1>
            <form
              ref={form}
              id={formId}
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <Field label={dayNoteField.label} validationMessage={lengthError}>
                <Textarea
                  value={draft.text}
                  onChange={(_event, { value }) => update(value)}
                  readOnly={!!draft.activity || !!draft.recovery}
                  rows={6}
                  resize="vertical"
                />
              </Field>
            </form>
            {draft.message && (
              <MessageBar intent={draft.recovery ? "warning" : "error"}>
                <MessageBarBody>{draft.message}</MessageBarBody>
              </MessageBar>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={cancel}
              disabled={!!draft.activity || draft.recovery === "unconfirmed"}
            >
              {draft.recovery === "refresh" ? "Close" : "Cancel"}
            </Button>
            {draft.recovery ? (
              <Button
                appearance="primary"
                icon={<ArrowClockwise16Regular />}
                onClick={() => void inspect()}
                disabled={!!draft.activity}
              >
                {draft.activity === "loading"
                  ? "Loading saved itinerary..."
                  : "Inspect saved itinerary"}
              </Button>
            ) : (
              <Button
                form={formId}
                type="submit"
                appearance="primary"
                disabled={!!draft.activity || !!lengthError}
              >
                {draft.activity === "saving" ? "Saving note..." : "Save"}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
