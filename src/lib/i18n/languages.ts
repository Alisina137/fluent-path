export interface NativeLanguage {
  code: string;
  name: string;
  native: string;
  flag: string;
  rtl?: boolean;
}

export const NATIVE_LANGUAGES: NativeLanguage[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fa", name: "Persian", native: "فارسی", flag: "🇮🇷", rtl: true },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦", rtl: true },
  { code: "zh", name: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", native: "한국어", flag: "🇰🇷" },
];

export function getLanguageByCode(code: string): NativeLanguage | undefined {
  return NATIVE_LANGUAGES.find((l) => l.code === code);
}
