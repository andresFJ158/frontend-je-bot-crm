'use client';

import { cn } from '@/lib/utils';

interface TagBadgeProps {
  tag: string;
}

const tagColors: Record<string, string> = {
  ventas: 'bg-primary/20 text-primary',
  soporte: 'bg-success/20 text-success',
  facturacion: 'bg-warning/20 text-warning',
  otros: 'bg-text-secondary/20 text-text-secondary',
};

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'text-xs px-2 py-1 rounded capitalize',
        tagColors[tag] || tagColors.otros
      )}
    >
      {tag}
    </span>
  );
}

