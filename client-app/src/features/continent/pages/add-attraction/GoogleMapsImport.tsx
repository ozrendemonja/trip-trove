import {
  InputField,
  InputFieldHandle
} from "../../../../shared/ui/forms/InputField";
import {
  Button,
  MessageBar,
  MessageBarBody,
  Spinner
} from "@fluentui/react-components";
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
import { Flex } from "../../../../shared/ui/Flex";
import { useGoogleMapsImportStyles } from "./GoogleMapsImport.styles";

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
  const classes = useGoogleMapsImportStyles();
  const [url, setUrl] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputRef = useRef<InputFieldHandle>(null);
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
          "Short share links (maps.app.goo.gl) cannot be read directly. Open the link in a browser, then copy the full URL from the address bar."
      });
      return;
    }

    const parsed = parseGoogleMapsUrl(trimmed);
    if (!parsed) {
      setStatus({
        kind: "error",
        message:
          "Could not recognise this URL. Copy the full URL from the Google Maps address bar after clicking a place."
      });
      return;
    }

    setStatus({ kind: "loading" });

    console.info("[GoogleMapsImport] parsed URL:", parsed);
    const lookup = await reverseGeocode(parsed.latitude, parsed.longitude);

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
        message: `${filledMessage} Address lookup failed (${lookup.reason}) — please add it manually.`
      });
    } else if (lookup.address === null) {
      setStatus({
        kind: "warning",
        message: `${filledMessage} No address found for these coordinates — please add it manually.`
      });
    } else {
      setStatus({ kind: "success", message: filledMessage });
    }
  }, [url, onImport]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleImport();
      }
    },
    [handleImport]
  );

  return (
    <Flex gap={8} className={className}>
      <Flex direction="row" align="flex-end" gap={12} wrap>
        <Flex grow className={classes.inputContainer}>
          <InputField
            label="Import from Google Maps"
            ref={inputRef}
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
            className={classes.input}
            disabled={status.kind === "loading"}
          />
        </Flex>
        <Button
          appearance="secondary"
          onClick={() => {
            void handleImport();
          }}
          disabled={status.kind === "loading" || url.trim().length === 0}
        >
          Import
        </Button>
      </Flex>
      {status.kind === "loading" && (
        <Spinner size="tiny" label="Looking up address..." />
      )}
      {status.kind === "success" && (
        <MessageBar intent="success">
          <MessageBarBody>{status.message}</MessageBarBody>
        </MessageBar>
      )}
      {status.kind === "warning" && (
        <MessageBar intent="warning">
          <MessageBarBody>{status.message}</MessageBarBody>
        </MessageBar>
      )}
      {status.kind === "error" && (
        <MessageBar intent="error">
          <MessageBarBody>{status.message}</MessageBarBody>
        </MessageBar>
      )}
    </Flex>
  );
});

GoogleMapsImport.displayName = "GoogleMapsImport";

export default GoogleMapsImport;
