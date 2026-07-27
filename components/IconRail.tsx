'use client';

import { Armchair, Lamp, Monitor, RotateCcw, Table2 } from 'lucide-react';
import clsx from 'clsx';
import { Category } from '@/data/products';
import { useWorkspaceStore } from '@/store/workspace';
import { Tooltip } from './Tooltip';

const RAIL: { category: Category; label: string; icon: React.ReactNode }[] = [
  { category: 'desk', label: 'Desks', icon: <Table2 className="w-5 h-5" /> },
  { category: 'chair', label: 'Chairs', icon: <Armchair className="w-5 h-5" /> },
  { category: 'monitor', label: 'Monitors', icon: <Monitor className="w-5 h-5" /> },
  { category: 'accessory', label: 'Accessories', icon: <Lamp className="w-5 h-5" /> },
];

export function IconRail({
  active,
  onSelect,
}: {
  active: Category | null;
  onSelect: (c: Category) => void;
}) {
  const totalItems = useWorkspaceStore((s) => s.totalItems());
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace);

  return (
    <nav
      aria-label="Product categories"
      className="h-full w-16 bg-slate-900/45 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl flex flex-col items-center py-3 gap-1"
    >
      {RAIL.map(({ category, label, icon }) => (
        <Tooltip key={category} label={label}>
          <button
            onClick={() => onSelect(category)}
            aria-label={label}
            aria-expanded={active === category}
            className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
              active === category
                ? 'bg-white text-slate-900 shadow-lg'
                : 'text-white/70 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95'
            )}
          >
            {icon}
          </button>
        </Tooltip>
      ))}
      <div className="flex-1" />
      {totalItems > 0 && (
        <Tooltip label="Reset workspace">
          <button
            onClick={resetWorkspace}
            aria-label="Reset workspace"
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </Tooltip>
      )}
    </nav>
  );
}
