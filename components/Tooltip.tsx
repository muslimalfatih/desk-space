'use client';

import { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Custom hover tooltip (no default browser tooltips) — glass chip that slides
 * out from the trigger. `side="left"` fits the right-hand icon rail.
 */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0, x: 6, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 4, scale: 0.97 }}
            transition={{ type: 'spring', bounce: 0, visualDuration: 0.18 }}
            className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 z-50 whitespace-nowrap rounded-lg bg-slate-900/85 backdrop-blur-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl"
          >
            {label}
            <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900/85" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
