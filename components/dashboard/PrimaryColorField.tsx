'use client';

import { useEffect, useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  hexForNativeColorInput,
  normalizePrimaryColor,
} from '@/lib/colors/cssColor';

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function PrimaryColorField({ value, onChange, disabled }: Props) {
  const id = useId();
  const [textValue, setTextValue] = useState(value);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    setTextValue(value);
    setHint(null);
  }, [value]);

  function commitText(raw: string) {
    const normalized = normalizePrimaryColor(raw);
    if (normalized) {
      setTextValue(normalized);
      setHint(null);
      onChange(normalized);
      return;
    }
    if (!raw.trim()) {
      setTextValue('');
      setHint(null);
      onChange('');
      return;
    }
    setTextValue(value);
    setHint('Enter a valid hex (#2563eb) or rgb(37, 99, 235) color.');
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          value={textValue}
          disabled={disabled}
          placeholder="#2563eb"
          className="min-w-0 flex-1 font-mono text-sm"
          onChange={(e) => {
            setTextValue(e.target.value);
            setHint(null);
          }}
          onBlur={() => commitText(textValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitText(textValue);
            }
          }}
        />
        <input
          type="color"
          disabled={disabled}
          value={hexForNativeColorInput(value)}
          aria-label="Pick primary color"
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          onChange={(e) => {
            const normalized = normalizePrimaryColor(e.target.value);
            if (normalized) {
              setTextValue(normalized);
              setHint(null);
              onChange(normalized);
            }
          }}
        />
      </div>
      {hint ? <p className="text-xs text-destructive">{hint}</p> : null}
    </div>
  );
}
