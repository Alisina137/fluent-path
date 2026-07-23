import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NATIVE_LANGUAGES } from "@/lib/i18n/languages";

interface Props {
  value: string;
  onChange: (code: string) => void;
}

export function LanguageSelector({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Choose your language" />
      </SelectTrigger>
      <SelectContent>
        {NATIVE_LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            <span className="mr-2">{l.flag}</span>
            {l.native} — {l.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}