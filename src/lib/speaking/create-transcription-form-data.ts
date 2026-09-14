import type { AudioRecording } from "@/hooks/useAudioRecorder";

type CreateTranscriptionFormDataInput = {
  userId: string;
  sessionId: string;
  recording: AudioRecording;
  language?: string;
};

function getFileExtension(mimeType: string): string {
  const normalizedType = mimeType.toLowerCase().split(";")[0]?.trim() ?? "";

  switch (normalizedType) {
    case "audio/webm":
      return "webm";

    case "audio/mp4":
      return "m4a";

    case "audio/ogg":
      return "ogg";

    default:
      return "audio";
  }
}

export function createTranscriptionFormData({
  userId,
  sessionId,
  recording,
  language,
}: CreateTranscriptionFormDataInput): FormData {
  const formData = new FormData();

  const extension = getFileExtension(recording.mimeType);

  const audioFile = new File([recording.blob], `speaking-recording.${extension}`, {
    type: recording.mimeType,
  });

  formData.append("userId", userId);
  formData.append("sessionId", sessionId);

  formData.append("durationMs", String(recording.durationMs));

  formData.append("audio", audioFile);

  if (language?.trim()) {
    formData.append("language", language.trim());
  }

  return formData;
}
