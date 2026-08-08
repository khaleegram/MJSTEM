'use client';

import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type ResponsibilitiesListProps = {
  items: readonly string[];
  className?: string;
};

export function ResponsibilitiesList({ items, className }: ResponsibilitiesListProps) {
  return (
    <ul className={cn('list-disc pl-5 space-y-1.5 text-sm text-muted-foreground', className)}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

type ResponsibilitiesAckProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  policyHref?: string;
  policyLabel?: string;
  disabled?: boolean;
};

export function ResponsibilitiesAck({
  id,
  checked,
  onCheckedChange,
  label,
  policyHref = '/ethics-policies',
  policyLabel = 'Ethics & Policies',
  disabled,
}: ResponsibilitiesAckProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-background/80 p-3">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <div className="space-y-1">
        <Label htmlFor={id} className="text-sm font-normal leading-snug cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">
          Full details:{' '}
          <Link href={policyHref} target="_blank" className="text-primary hover:underline">
            {policyLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
