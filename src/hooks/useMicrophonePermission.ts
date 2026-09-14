import { useCallback, useEffect, useState } from "react";

export type MicrophonePermissionState =
  "checking" | "prompt" | "granted" | "denied" | "unsupported" | "unavailable" | "error";

type MicrophonePermissionResult = {
  state: MicrophonePermissionState;
  errorMessage: string | null;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  refreshPermission: () => Promise<void>;
};

function getMicrophoneErrorMessage(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return "Unable to access your microphone.";
  }

  switch (error.name) {
    case "NotAllowedError":
      return "Microphone access was denied. Allow microphone access in your browser settings to use voice practice.";

    case "NotFoundError":
      return "No microphone was found on this device.";

    case "NotReadableError":
      return "Your microphone is currently unavailable or being used by another application.";

    case "OverconstrainedError":
      return "The available microphone does not support the requested audio settings.";

    case "SecurityError":
      return "Microphone access is blocked by the browser's security settings.";

    case "AbortError":
      return "Microphone access was interrupted. Please try again.";

    default:
      return "Unable to access your microphone.";
  }
}

export function useMicrophonePermission(): MicrophonePermissionResult {
  const [state, setState] = useState<MicrophonePermissionState>("checking");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSupported =
    typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

  const refreshPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }

    setErrorMessage(null);

    if (!navigator.permissions?.query) {
      setState("prompt");
      return;
    }

    try {
      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      switch (result.state) {
        case "granted":
          setState("granted");
          break;

        case "denied":
          setState("denied");
          break;

        default:
          setState("prompt");
          break;
      }
    } catch {
      // Some browsers support getUserMedia but do not expose
      // microphone state through the Permissions API.
      setState("prompt");
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");

      setErrorMessage("Microphone access is not supported by this browser or environment.");

      return false;
    }

    setErrorMessage(null);

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setState("granted");

      return true;
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          setState("denied");
        } else if (error.name === "NotFoundError") {
          setState("unavailable");
        } else {
          setState("error");
        }
      } else {
        setState("error");
      }

      setErrorMessage(getMicrophoneErrorMessage(error));

      return false;
    } finally {
      stream?.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }, []);

  useEffect(() => {
    void refreshPermission();
  }, [refreshPermission]);

  return {
    state,
    errorMessage,
    isSupported,
    requestPermission,
    refreshPermission,
  };
}
