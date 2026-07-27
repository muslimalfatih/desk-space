'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ArrowRight, Hand } from 'lucide-react';
import { IconRail } from '@/components/IconRail';
import { CategoryFlyout } from '@/components/CategoryFlyout';
import { SummaryDrawer } from '@/components/SummaryDrawer';
import { useWorkspaceStore } from '@/store/workspace';
import { Category, PRODUCTS, usd } from '@/data/products';
import { slotById } from '@/components/three/slots';

// R3F must not render on the server; skeleton shows while the chunk loads.
const Scene = dynamic(() => import('@/components/three/Scene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-b from-[#f3eee6] to-[#e6d9bc] flex items-center justify-center">
      <div className="text-center animate-pulse">
        <span className="text-4xl">🏝️</span>
        <p className="text-sm font-medium text-slate-600 mt-2">Setting up your studio…</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<Category | null>('desk');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const weeklyTotal = useWorkspaceStore((s) => s.weeklyTotal());
  const totalItems = useWorkspaceStore((s) => s.totalItems());
  const hasDragged = useWorkspaceStore((s) => s.hasDragged);
  const stageRef = useRef<HTMLDivElement>(null);

  /** DOM side of drag-from-catalog: feed pointer NDC to the scene, commit on drop. */
  const onStageDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('text/product')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const rect = stageRef.current!.getBoundingClientRect();
    const st = useWorkspaceStore.getState();
    const productId = st.panelDrag?.productId;
    if (!productId) return;
    st.setPanelDrag({
      productId,
      ndc: [
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      ],
    });
  };
  const onStageDrop = (e: React.DragEvent) => {
    const id = e.dataTransfer.getData('text/product');
    if (!id) return;
    e.preventDefault();
    const st = useWorkspaceStore.getState();
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return;
    const snap = st.panelSnap ? slotById(product, st.panelSnap) : null;
    if (product.category === 'desk') {
      st.selectDesk(product);
    } else if (product.category === 'chair') {
      st.selectChair(product);
      if (snap) st.placeUnit('chair', snap.id);
    } else {
      st.addExtra(product, snap ? { x: snap.x, z: snap.z } : undefined);
    }
    st.markDragged();
    st.setPanelDrag(null);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="h-dvh relative overflow-hidden bg-[#efeae2]">
        <h1 className="sr-only">Design Your Workspace — workspace.rent office furniture rentals</h1>

        {/* 3D stage — also the drop target for catalog cards */}
        <div
          ref={stageRef}
          className="absolute inset-0"
          onDragOver={onStageDragOver}
          onDrop={onStageDrop}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) useWorkspaceStore.getState().setPanelDrag(null);
          }}
          onDragEnterCapture={(e) => {
            // seed panelDrag as soon as the card crosses onto the stage
            if (!e.dataTransfer.types.includes('text/product')) return;
            const st = useWorkspaceStore.getState();
            if (!st.panelDrag) {
              // productId arrives via dataTransfer only on drop; mirror it from the drag source
              const id = document.body.dataset.draggingProduct;
              if (id) st.setPanelDrag({ productId: id, ndc: [0, 0] });
            }
          }}
        >
          <Scene />
        </div>

        {/* Contextual hint — dismissed by the first successful drag */}
        <AnimatePresence>
          {totalItems > 0 && !hasDragged && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ delay: 1 }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-2 bg-slate-900/60 backdrop-blur-xl border border-white/15 rounded-full px-4 py-2 shadow-2xl"
            >
              <Hand className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-xs font-medium text-white/90">
                Drag items to rearrange — they snap into place
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating top bar — stays inside the canvas area, shifts when the flyout opens */}
        <div
          className={`absolute top-0 left-0 z-30 pointer-events-none flex items-start justify-between gap-3 p-3 sm:p-4 transition-[right] duration-300 ${
            activeCategory ? 'right-[440px] sm:right-[480px]' : 'right-[88px]'
          }`}
        >
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/45 backdrop-blur-xl border border-white/15 rounded-full pl-3 pr-4 py-2 shadow-2xl">
            <span className="text-xl">🪴</span>
            <div className="leading-none">
              <span className="font-bold text-white">workspace</span>
              <span className="font-bold text-emerald-300">.rent</span>
              <p className="text-[10px] text-white/60 mt-0.5">Build it before you rent it</p>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/45 backdrop-blur-xl border border-white/15 rounded-full p-1.5 pl-4 shadow-2xl">
            <div className="leading-none text-right">
              <p className="font-extrabold text-white">
                {usd(weeklyTotal)}
                <span className="text-xs font-normal text-white/50">/wk</span>
              </p>
              <p className="text-[10px] text-white/60 mt-0.5">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            </div>
            <button
              onClick={() => setSummaryOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-full transition-all duration-150 shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Summary
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: icon rail + flyout */}
        <div className="absolute right-0 top-0 z-20 h-full flex gap-3 p-3">
          <IconRail
            active={activeCategory}
            onSelect={(c) => setActiveCategory((cur) => (cur === c ? null : c))}
          />
          <AnimatePresence>
            {activeCategory && (
              <div className="h-full w-[min(340px,calc(100vw-64px))] sm:w-[380px]">
                <CategoryFlyout category={activeCategory} onClose={() => setActiveCategory(null)} />
              </div>
            )}
          </AnimatePresence>
        </div>

        <SummaryDrawer open={summaryOpen} onClose={() => setSummaryOpen(false)} />
      </div>
    </MotionConfig>
  );
}
