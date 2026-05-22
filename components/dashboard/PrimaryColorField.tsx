'use client';

import { ColorField } from '@/components/dashboard/ColorField';

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function PrimaryColorField({ value, onChange, disabled }: Props) {
  return (
    <ColorField
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder="#2563eb"
      pickerAriaLabel="Pick primary color"
    />
  );
}
