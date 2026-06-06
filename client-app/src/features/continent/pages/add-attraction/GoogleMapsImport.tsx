import {
  DefaultButton,
  ITextField,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Stack,
  TextField
} from "@fluentui/react";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import {
  formatCoords,
  isShortGoogleMapsUrl,
  parseGoogleMapsUrl
} from "./parseGoogleMapsUrl";
import { reverseGeocode } from "./reverseGeocode";

export interface GoogleMapsImportPayload {
  name?: string;
  address?: string;
  geoLocation: string;
}

export interface GoogleMapsImportProps {
  onImport: (payload: GoogleMapsImportPayload) => void;
  className?: string;
}

export interface GoogleMapsImportHandle {
  focus: () => void;
  clear: () => void;
  hasValue: () => boolean;
}

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "warning"; message: string }
  | { kind: "error"; message: string };

export const GoogleMapsImport = forwardRef<
  GoogleMapsImportHandle,
  GoogleMapsImportProps
>(({ onImport, className }, ref) => {
  const [url, setUrl] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputRef = useRef<ITextField>(null);
  const urlRef = useRef<string>("");
  urlRef.current = url;

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        setUrl("");
        setStatus({ kind: "idle" });
      },
      hasValue: () => urlRef.current.trim().length > 0
    }),
    []
  );

  const handleImport = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setStatus({
        kind: "error",
        message: "Paste a Google Maps URL first."
      });
      return;
    }

    if (isShortGoogleMapsUrl(trimmed)) {
      setStatus({
        kind: "error",
        message:
          // eslint-disable-next-line @fluentui/max-len
          "Short share links (maps.app.goo.gl) cannot be read directly. Open the link in a browser, then copy the full URL from the address bar."
      });
      return;
    }

    const parsed = parseGoogleMapsUrl(trimmed);
    if (!parsed) {
      setStatus({
        kind: "error",
        message:
          // eslint-disable-next-line @fluentui/max-len
          "Could not recognise this URL. Copy the full URL from the Google Maps address bar after clicking a place."
      });
      return;
    }

    setStatus({ kind: "loading" });

    // eslint-disable-next-line no-console
    console.info("[GoogleMapsImport] parsed URL:", parsed);
    const lookup = await reverseGeocode(parsed.latitude, parsed.longitude);
    // eslint-disable-next-line no-console
    console.info("[GoogleMapsImport] reverseGeocode result:", lookup);
    const address = lookup.ok && lookup.address ? lookup.address : undefined;

    onImport({
      name: parsed.name,
      address,
      geoLocation: formatCoords(parsed.latitude, parsed.longitude)
    });

    const filledParts: string[] = [];
    if (parsed.name) {
      filledParts.push("name");
    }
    filledParts.push("coordinates");
    if (address) {
      filledParts.push("address");
    }
    const filledMessage = `Filled ${filledParts.join(", ")} from Google Maps.`;

    if (!lookup.ok) {
      setStatus({
        kind: "warning",
        message:
          // eslint-disable-next-line @fluentui/max-len
          `${filledMessage} Address lookup failed (${lookup.reason}) — please add it manually.`
      });
    } else if (lookup.address === null) {
      setStatus({
        kind: "warning",
        message:
          // eslint-disable-next-line @fluentui/max-len
          `${filledMessage} No address found for these coordinates — please add it manually.`
      });
    } else {
      setStatus({ kind: "success", message: filledMessage });
    }
  }, [url, onImport]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleImport();
      }
    },
    [handleImport]
  );

  return (
    <Stack tokens={{ childrenGap: 8 }} className={className}>
      <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 12 }}>
        <TextField
          label="Import from Google Maps"
          componentRef={inputRef}
          placeholder="Paste a Google Maps URL (e.g. https://www.google.com/maps/place/...)"
          value={url}
          onChange={(_e, value) => {
            setUrl(value ?? "");
            if (
              status.kind === "error" ||
              status.kind === "success" ||
              status.kind === "warning"
            ) {
              setStatus({ kind: "idle" });
            }
          }}
          onKeyDown={handleKeyDown}
          styles={{ root: { flexGrow: 1 } }}
          disabled={status.kind === "loading"}
        />
        <DefaultButton
          text="Import"
          onClick={() => {
            void handleImport();
          }}
          disabled={status.kind === "loading" || url.trim().length === 0}
        />
      </Stack>
      {status.kind === "loading" && (
        <Spinner size={SpinnerSize.small} label="Looking up address..." />
      )}
      {status.kind === "success" && (
        <MessageBar messageBarType={MessageBarType.success}>
          {status.message}
        </MessageBar>
      )}
      {status.kind === "warning" && (
        <MessageBar messageBarType={MessageBarType.warning}>
          {status.message}
        </MessageBar>
      )}
      {status.kind === "error" && (
        <MessageBar messageBarType={MessageBarType.error}>
          {status.message}
        </MessageBar>
      )}
    </Stack>
  );
});

GoogleMapsImport.displayName = "GoogleMapsImport";

export default GoogleMapsImport;
