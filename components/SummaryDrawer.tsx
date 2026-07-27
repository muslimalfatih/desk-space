'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ImageOff, MessageCircle, ShoppingCart, X } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace';
import { Product, usd } from '@/data/products';

interface SummaryDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface LineItem {
  product: Product;
  qty: number;
}

type Step = 'summary' | 'form' | 'done';

interface RequestDetails {
  name: string;
  whatsapp: string;
  area: string;
  date: string;
  ref: string;
}

const AREAS = ['Canggu', 'Seminyak', 'Ubud', 'Uluwatu', 'Sanur', 'Other'];
// ponytail: placeholder business number — swap for the real business line.
const BUSINESS_WA = '6281234567890';

export function SummaryDrawer({ open, onClose }: SummaryDrawerProps) {
  const { desk, chair, extras, extraProducts, resetWorkspace } = useWorkspaceStore();
  const weeklyTotal = useWorkspaceStore((s) => s.weeklyTotal());
  const monthlyTotal = useWorkspaceStore((s) => s.monthlyTotal());
  const totalItems = useWorkspaceStore((s) => s.totalItems());

  const [step, setStep] = useState<Step>('summary');
  const [sending, setSending] = useState(false);
  const [details, setDetails] = useState<RequestDetails | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Fresh start each open; Escape + scroll lock + initial focus while open.
  // ponytail: no full focus trap — add focus-trap-react if this ever ships.
  useEffect(() => {
    if (!open) return;
    setStep('summary');
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const items: LineItem[] = [
    ...(desk ? [{ product: desk, qty: 1 }] : []),
    ...(chair ? [{ product: chair, qty: 1 }] : []),
    ...Object.entries(extras).flatMap(([id, qty]) => {
      const p = extraProducts[id];
      return p ? [{ product: p, qty }] : [];
    }),
  ];

  // The monthly rate is genuinely cheaper than 4 weeks — show it
  const monthlySavings = weeklyTotal * 4 - monthlyTotal;

  // Local-time date string — toISOString() is UTC and lands a day early in Bali (+08:00).
  const localISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const defaultStart = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // "needs a workspace by next week"
    return localISO(d);
  };
  const today = localISO(new Date());

  const orderText = [
    'Hi workspace.rent! I built a workspace setup:',
    ...items.map(({ product, qty }) => `• ${product.name}${qty > 1 ? ` ×${qty}` : ''}`),
    `${usd(weeklyTotal)}/week or ${usd(monthlyTotal)}/month`,
    'Can you confirm availability?',
  ].join('\n');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSending(true);
    // ponytail: request-only flow, no backend — swap the timeout for a POST when there's an endpoint.
    await new Promise((r) => setTimeout(r, 700));
    setDetails({
      name: String(fd.get('name')),
      whatsapp: String(fd.get('whatsapp')),
      area: String(fd.get('area')),
      date: String(fd.get('date')),
      ref: `MNS-${Date.now().toString(36).toUpperCase().slice(-5)}`,
    });
    setSending(false);
    setStep('done');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Setup summary"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-50 h-full w-full sm:w-[440px] bg-slate-900/60 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col text-white [color-scheme:dark]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                {step === 'form' && (
                  <button
                    onClick={() => setStep('summary')}
                    aria-label="Back to summary"
                    className="w-8 h-8 -ml-1 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h2 className="font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-300" />
                    {step === 'form' ? 'Almost there' : step === 'done' ? 'Request sent' : 'Your Setup'}
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    {step === 'form'
                      ? 'Where should we deliver it?'
                      : `${totalItems} ${totalItems === 1 ? 'item' : 'items'} · weekly rental, Bali-wide delivery`}
                  </p>
                </div>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close summary"
                className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ── Step: summary ── */}
              {step === 'summary' && (
                <motion.div key="summary" {...stepAnim} className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    {items.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-6">
                        <span className="text-5xl">🛒</span>
                        <p className="font-semibold text-white/80 mt-3">Nothing here yet</p>
                        <p className="text-sm text-white/50 mt-1">
                          Pick a desk from the side rail to start your setup.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {items.map(({ product, qty }) => (
                          <li
                            key={product.id}
                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5"
                          >
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image}
                                alt=""
                                className="w-14 h-14 rounded-lg object-contain bg-white border border-white/10"
                              />
                            ) : (
                              <span className="w-14 h-14 rounded-lg bg-emerald-50 border border-dashed border-emerald-300 flex items-center justify-center text-emerald-600">
                                <ImageOff className="w-5 h-5" />
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm leading-tight">
                                {product.name}
                              </p>
                              <p className="text-xs text-white/60 mt-0.5">
                                {usd(product.priceWeek)}/wk{qty > 1 && ` × ${qty}`}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-emerald-300 whitespace-nowrap">
                              {usd(product.priceWeek * qty)}
                              <span className="font-normal text-white/50 text-xs">/wk</span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="border-t border-white/10 px-4 py-3 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Weekly total</span>
                        <span className="font-extrabold text-white text-lg">
                          {usd(weeklyTotal)}
                          <span className="text-xs font-normal text-white/50">/wk</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Monthly total</span>
                        <span className="font-bold text-white">
                          {usd(monthlyTotal)}
                          <span className="text-xs font-normal text-white/50">/mo</span>
                        </span>
                      </div>
                      {monthlySavings > 0 && items.length > 0 && (
                        <p className="text-xs font-medium text-emerald-300">
                          Monthly saves {usd(monthlySavings)} vs 4 weekly renewals
                        </p>
                      )}
                    </div>
                    <button
                      disabled={items.length === 0}
                      onClick={() => setStep('form')}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-150 shadow-md hover:shadow-lg disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                      Rent Your Setup!
                    </button>
                    <p className="text-[11px] text-white/40 text-center">
                      We&apos;ll confirm availability by WhatsApp before any payment.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── Step: form ── */}
              {step === 'form' && (
                <motion.div key="form" {...stepAnim} className="flex-1 flex flex-col min-h-0">
                  <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                      <label className="block">
                        <span className="text-xs font-semibold text-white/80">Your name</span>
                        <input
                          name="name"
                          type="text"
                          required
                          autoFocus
                          autoComplete="name"
                          className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-white/80">WhatsApp number</span>
                        <input
                          name="whatsapp"
                          type="tel"
                          required
                          placeholder="+62 812..."
                          autoComplete="tel"
                          className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-white/80">Delivery area</span>
                        <select
                          name="area"
                          required
                          defaultValue="Canggu"
                          className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        >
                          {AREAS.map((a) => (
                            <option key={a}>{a}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold text-white/80">Setup ready by</span>
                        <input
                          name="date"
                          type="date"
                          required
                          min={today}
                          defaultValue={defaultStart()}
                          className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 text-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        />
                        <span className="mt-1 block text-[11px] text-white/40">
                          Free delivery &amp; assembly across Bali.
                        </span>
                      </label>
                    </div>

                    <div className="border-t border-white/10 px-4 py-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">{totalItems} items</span>
                        <span className="font-bold text-white">
                          {usd(weeklyTotal)}/wk · {usd(monthlyTotal)}/mo
                        </span>
                      </div>
                      <button
                        type="submit"
                        disabled={sending}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-150 shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                      >
                        {sending ? 'Sending…' : 'Send request'}
                      </button>
                      <a
                        href={`https://wa.me/${BUSINESS_WA}?text=${encodeURIComponent(orderText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-700 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        or send it via WhatsApp instead
                      </a>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ── Step: done ── */}
              {step === 'done' && details && (
                <motion.div
                  key="done"
                  {...stepAnim}
                  className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-1"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.35, visualDuration: 0.4 }}
                    className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-7 h-7" />
                  </motion.div>
                  <p className="font-bold text-white text-lg mt-3">Request sent</p>
                  <p className="text-xs font-mono font-semibold text-white/50 tracking-wider">
                    {details.ref}
                  </p>
                  <p className="text-sm text-white/70 mt-2 max-w-[300px]">
                    Thanks {details.name}! We&apos;ll WhatsApp{' '}
                    <span className="font-semibold text-white">{details.whatsapp}</span> within 2
                    hours to confirm availability.
                  </p>
                  <div className="mt-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-white/70">
                    {totalItems} items · {usd(weeklyTotal)}/wk ({usd(monthlyTotal)}/mo)
                    <br />
                    delivering to <span className="font-semibold">{details.area}</span> by{' '}
                    <span className="font-semibold">{details.date}</span>
                  </div>
                  <button
                    onClick={() => {
                      resetWorkspace();
                      onClose();
                    }}
                    className="mt-5 text-sm font-semibold text-emerald-300 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg px-2 py-1"
                  >
                    Design another setup
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const stepAnim = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
  transition: { duration: 0.16 },
} as const;
