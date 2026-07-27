'use client';

import { motion } from 'framer-motion';
import { Check, ImageOff, Minus, Plus, X } from 'lucide-react';
import clsx from 'clsx';
import { byCategory, Category, MONITOR_CAP, Product, usd } from '@/data/products';
import { useWorkspaceStore } from '@/store/workspace';

/** HTML5 drag source — mouse path for drag-into-scene; click/tap add still works everywhere. */
function useCardDrag(product: Product) {
  const setPanelDrag = useWorkspaceStore((s) => s.setPanelDrag);
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('text/product', product.id);
      e.dataTransfer.effectAllowed = 'copy';
      // dataTransfer is unreadable during dragover (protected mode) — publish
      // the id where the stage's dragenter can see it mid-flight
      document.body.dataset.draggingProduct = product.id;
    },
    onDragEnd: () => {
      delete document.body.dataset.draggingProduct;
      setPanelDrag(null);
    },
  };
}

const TITLES: Record<Category, { title: string; hint: string }> = {
  desk: { title: 'Desks', hint: 'Pick one — it anchors your whole setup' },
  chair: { title: 'Chairs', hint: 'Pick one your back will thank you for' },
  monitor: { title: 'Monitors', hint: `Mix models — up to ${MONITOR_CAP} on the desk` },
  accessory: { title: 'Accessories', hint: 'The extras that make it feel like yours' },
};

export function CategoryFlyout({ category, onClose }: { category: Category; onClose: () => void }) {
  const { desk, chair, extras, selectDesk, selectChair, addExtra, removeExtra, monitorCount } =
    useWorkspaceStore();
  const monitorsFull = monitorCount() >= MONITOR_CAP;
  const products = byCategory(category);
  const single = category === 'desk' || category === 'chair';
  const selectedId = category === 'desk' ? desk?.id : chair?.id;

  return (
    <motion.div
      key={category}
      initial={{ x: 24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0, visualDuration: 0.25 }}
      className="h-full w-[340px] sm:w-[380px] bg-slate-900/45 backdrop-blur-xl border border-white/15 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
    >
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-white/10">
        <div>
          <h2 className="font-bold text-white text-lg">{TITLES[category].title}</h2>
          <p className="text-xs text-white/60 mt-0.5">{TITLES[category].hint} · drag a card into the room</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start"
        role={single ? 'radiogroup' : undefined}
        aria-label={single ? TITLES[category].title : undefined}
      >
        {products.map((p) =>
          single ? (
            <SelectCard
              key={p.id}
              product={p}
              selected={selectedId === p.id}
              onSelect={() => (category === 'desk' ? selectDesk(p) : selectChair(p))}
            />
          ) : (
            <QtyCard
              key={p.id}
              product={p}
              qty={extras[p.id] ?? 0}
              addDisabled={
                (extras[p.id] ?? 0) >= p.maxQty || (p.category === 'monitor' && monitorsFull)
              }
              onAdd={() => addExtra(p)}
              onRemove={() => removeExtra(p.id)}
            />
          )
        )}
      </div>

      {category === 'monitor' && (
        <p className="px-4 py-2.5 border-t border-white/10 text-[11px] text-white/60">
          {monitorCount()}/{MONITOR_CAP} monitors on the desk
        </p>
      )}
    </motion.div>
  );
}

function ProductImage({ product }: { product: Product }) {
  if (!product.image) {
    // Placeholder at the card's real aspect — swap the URL in data/products.ts
    return (
      <div className="w-full aspect-[4/3] rounded-lg bg-emerald-400/10 border border-dashed border-emerald-300/50 flex flex-col items-center justify-center gap-1 text-emerald-200">
        <ImageOff className="w-5 h-5" />
        <span className="text-[10px] font-medium text-center px-2">
          Photo placeholder — swap URL in data/products.ts
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote CDN, plain img keeps config zero
    <img
      src={product.image}
      alt={product.name}
      loading="lazy"
      className="w-full aspect-[4/3] rounded-lg object-contain bg-white transition-transform duration-300 group-hover:scale-[1.04]"
    />
  );
}

function PriceRow({ product }: { product: Product }) {
  return (
    <p className="text-sm font-bold text-emerald-300 mt-1">
      {usd(product.priceWeek)}
      <span className="font-normal text-white/50 text-xs">/wk</span>
      <span className="font-normal text-white/50 text-xs"> · {usd(product.priceMonth)}/mo</span>
    </p>
  );
}

function SelectCard({
  product,
  selected,
  onSelect,
}: {
  product: Product;
  selected: boolean;
  onSelect: () => void;
}) {
  const dragProps = useCardDrag(product);
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      {...dragProps}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={clsx(
        'group relative rounded-xl border-2 p-2.5 cursor-grab active:cursor-grabbing transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        selected
          ? 'border-emerald-400 bg-emerald-400/15 shadow-md'
          : 'border-white/15 bg-white/5 hover:border-emerald-300/70 hover:bg-white/10'
      )}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 z-10 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow"
        >
          <Check className="w-3.5 h-3.5" />
        </motion.span>
      )}
      <ProductImage product={product} />
      <p className="font-semibold text-white text-sm leading-tight mt-2">{product.name}</p>
      <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{product.description}</p>
      <PriceRow product={product} />
    </div>
  );
}

function QtyCard({
  product,
  qty,
  addDisabled,
  onAdd,
  onRemove,
}: {
  product: Product;
  qty: number;
  addDisabled: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const dragProps = useCardDrag(product);
  return (
    <div
      {...dragProps}
      className={clsx(
        'group relative rounded-xl border-2 p-2.5 cursor-grab active:cursor-grabbing transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/30',
        qty > 0 ? 'border-emerald-400 bg-emerald-400/15' : 'border-white/15 bg-white/5'
      )}
    >
      {qty > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 z-10 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow"
        >
          {qty}
        </motion.span>
      )}
      <ProductImage product={product} />
      <p className="font-semibold text-white text-sm leading-tight mt-2">{product.name}</p>
      <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{product.description}</p>
      <PriceRow product={product} />
      <div className="mt-2 flex items-center gap-1.5 justify-end">
        {qty > 0 && (
          <button
            onClick={onRemove}
            aria-label={`Remove one ${product.name}`}
            className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Minus className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={onAdd}
          disabled={addDisabled}
          aria-label={`Add ${product.name}`}
          className={clsx(
            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            addDisabled
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          )}
        >
          <Plus className="w-3 h-3" />
          {qty === 0 ? 'Add' : 'More'}
        </button>
      </div>
    </div>
  );
}
