import React, { useCallback, useMemo } from 'react';
import { Monitor, Scaling } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useEntityStore } from '../stores/entityStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { EditToggle } from '../components/ui/EditToggle';
import { PageHeaderActions } from '../components/ui/PageHeaderActions';
import { EditBadge } from '../components/ui/EditBadge';
import { SortableGrid } from '../components/ui/SortableGrid';
import { SortableItem } from '../components/ui/SortableItem';
import { ActivityCard } from '../components/home/ActivityCard';
import { SystemHeroCard } from '../components/system/SystemHeroCard';
import { SystemMonitorCard } from '../components/system/SystemMonitorCard';
import { BatteriesCard } from '../components/system/BatteriesCard';
import { applyStoredOrder } from '../lib/order';
import './Page.css';
import './System.css';

// ---------------------------------------------------------------------------
// Section config
// ---------------------------------------------------------------------------

const SECTION_IDS = ['system_hero', 'activity', 'system_monitor', 'batteries'] as const;
type SectionId = typeof SECTION_IDS[number];

const SECTION_LABELS: Record<SectionId, string> = {
  system_hero:    'System Overview',
  activity:       'Activity',
  system_monitor: 'System Monitor',
  batteries:      'Batteries',
};

const MAX_COLS = 4;

const DEFAULT_SPANS: Record<string, number> = {
  system_hero:    2,
  activity:       2,
  system_monitor: 2,
  batteries:      2,
};

function getSpan(id: string, stored: Record<string, number>): number {
  return stored[id] ?? DEFAULT_SPANS[id] ?? 1;
}

function spanClass(span: number): string {
  if (span >= 4) return 'overview-grid__cell--span-4';
  if (span === 3) return 'overview-grid__cell--span-3';
  if (span === 2) return 'overview-grid__cell--span-2';
  return '';
}

// ---------------------------------------------------------------------------
// Span dots + resize handle (same pattern as Security / Scenes)
// ---------------------------------------------------------------------------

function SpanDots({ span }: { span: number }) {
  return (
    <div className="overview-span-dots" aria-hidden="true">
      {Array.from({ length: MAX_COLS }, (_, i) => (
        <span
          key={i}
          className={`overview-span-dot${i < span ? ' overview-span-dot--filled' : ''}`}
        />
      ))}
    </div>
  );
}

function ResizeHandle({
  id, span, onCommit,
}: {
  id: string;
  span: number;
  onCommit: (id: string, newSpan: number) => void;
}) {
  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);
    const sectionEl = btn.closest('[data-section]') as HTMLElement | null;
    const gridEl    = btn.closest('.overview-grid') as HTMLElement | null;
    if (!sectionEl || !gridEl) return;
    const gridItem  = sectionEl.parentElement as HTMLElement;
    const colWidth  = gridEl.getBoundingClientRect().width / MAX_COLS;
    const startX    = e.clientX;
    const startSpan = span;
    let previewSpan = startSpan;
    function onMove(me: PointerEvent) {
      const delta = Math.round((me.clientX - startX) / colWidth);
      const next  = Math.max(1, Math.min(MAX_COLS, startSpan + delta));
      if (next !== previewSpan) {
        previewSpan = next;
        gridItem.style.gridColumn = next >= MAX_COLS ? '1 / -1' : next > 1 ? `span ${next}` : '';
      }
    }
    function onUp() {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      gridItem.style.gridColumn = '';
      onCommit(id, previewSpan);
    }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }
  return (
    <button
      type="button"
      className="overview-resize-handle"
      onPointerDown={handlePointerDown}
      aria-label={`Drag to resize — currently ${span} of ${MAX_COLS} columns`}
      title={`Drag left / right to resize (${span} of ${MAX_COLS} columns)`}
    >
      <Scaling size={12} strokeWidth={2.5} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const LOW_BATTERY_THRESHOLD = 20;

export function System() {
  const { entities, registries } = useEntityStore(
    useShallow((s) => ({ entities: s.entities, registries: s.registries }))
  );

  const hiddenEntities         = useSettingsStore((s) => s.customization.hiddenEntities);
  const systemSectionOrder     = useSettingsStore(useShallow((s) => s.customization.systemSectionOrder));
  const hiddenSystemSections   = useSettingsStore(useShallow((s) => s.customization.hiddenSystemSections));
  const mobileHiddenSystemSections = useSettingsStore(useShallow((s) => s.customization.mobileHiddenSystemSections));
  const systemSectionSpans     = useSettingsStore(useShallow((s) => s.customization.systemSectionSpans));
  const updateCustomization    = useSettingsStore((s) => s.updateCustomization);
  const editMode               = useUIStore((s) => s.editMode);

  const allEntities = useMemo(() => Object.values(entities), [entities]);

  // System Monitor entities — identified via entity registry platform field
  const systemMonitorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const re of (registries?.entities ?? [])) {
      if (re.platform === 'systemmonitor') ids.add(re.entity_id);
    }
    return ids;
  }, [registries]);

  const systemMonitorEntities = useMemo(
    () => allEntities.filter((e) => systemMonitorIds.has(e.entity_id)),
    [allEntities, systemMonitorIds]
  );

  // Battery sensors — device_class=battery, numeric state, sorted lowest first
  const batteries = useMemo(
    () =>
      allEntities
        .filter((e) => {
          if (!e.entity_id.startsWith('sensor.')) return false;
          if ((e.attributes.device_class as string | undefined) !== 'battery') return false;
          if (!editMode && hiddenEntities.includes(e.entity_id)) return false;
          return !isNaN(parseFloat(e.state));
        })
        .sort((a, b) => parseFloat(a.state) - parseFloat(b.state)),
    [allEntities, hiddenEntities, editMode]
  );

  // Counts for the hero card
  const lowBatteryCount = useMemo(
    () => batteries.filter((e) => parseFloat(e.state) <= LOW_BATTERY_THRESHOLD).length,
    [batteries]
  );

  const unavailableCount = useMemo(
    () =>
      allEntities.filter(
        (e) => e.state === 'unavailable' && !hiddenEntities.includes(e.entity_id)
      ).length,
    [allEntities, hiddenEntities]
  );

  // Section visibility
  const sectionExists: Record<SectionId, boolean> = {
    system_hero:    true,
    activity:       true,
    system_monitor: editMode ? systemMonitorEntities.length > 0 : systemMonitorEntities.filter((e) => e.state !== 'unavailable').length > 0,
    batteries:      editMode ? batteries.length > 0 : batteries.length > 0,
  };

  const allSectionIds  = SECTION_IDS.filter((id) => sectionExists[id]) as SectionId[];
  const orderedIds     = applyStoredOrder(allSectionIds, systemSectionOrder) as SectionId[];
  const visibleIds     = (
    editMode ? orderedIds : orderedIds.filter((id) => !hiddenSystemSections.includes(id))
  ) as SectionId[];

  const handleToggleHidden = useCallback((id: string) => {
    const next = hiddenSystemSections.includes(id)
      ? hiddenSystemSections.filter((s) => s !== id)
      : [...hiddenSystemSections, id];
    updateCustomization({ hiddenSystemSections: next });
  }, [hiddenSystemSections, updateCustomization]);

  const handleToggleMobileHidden = useCallback((id: string) => {
    const next = mobileHiddenSystemSections.includes(id)
      ? mobileHiddenSystemSections.filter((s) => s !== id)
      : [...mobileHiddenSystemSections, id];
    updateCustomization({ mobileHiddenSystemSections: next });
  }, [mobileHiddenSystemSections, updateCustomization]);

  const handleSpanChange = useCallback((id: string, newSpan: number) => {
    updateCustomization({
      systemSectionSpans: { ...systemSectionSpans, [id]: newSpan },
    });
  }, [systemSectionSpans, updateCustomization]);

  const handleReorder = useCallback((newOrder: string[]) => {
    updateCustomization({ systemSectionOrder: newOrder });
  }, [updateCustomization]);

  function renderWidget(id: SectionId): React.ReactNode {
    switch (id) {
      case 'system_hero':
        return (
          <SystemHeroCard
            systemMonitorEntities={systemMonitorEntities}
            lowBatteryCount={lowBatteryCount}
            unavailableCount={unavailableCount}
          />
        );
      case 'activity':
        return <ActivityCard entities={entities} hideSeeAll />;
      case 'system_monitor':
        return <SystemMonitorCard entities={systemMonitorEntities} />;
      case 'batteries':
        return <BatteriesCard batteries={batteries} />;
    }
  }

  return (
    <div className="page system-page stagger-rise">
      <div className="page__header-row">
        <h1 className="page__title">System</h1>
        <PageHeaderActions><EditToggle /></PageHeaderActions>
      </div>

      <SortableGrid
        items={visibleIds}
        onReorder={handleReorder}
        editMode={editMode}
        className="overview-grid"
      >
        {visibleIds.map((id) => {
          const isHidden       = hiddenSystemSections.includes(id);
          const isMobileHidden = mobileHiddenSystemSections.includes(id);
          const currentSpan = getSpan(id, systemSectionSpans);
          const sc          = spanClass(currentSpan);
          const widget      = renderWidget(id);

          if (!widget) return null;

          if (!editMode) {
            return (
              <div
                key={id}
                className={['overview-grid__cell', sc, isMobileHidden ? 'section-mobile-hidden' : ''].filter(Boolean).join(' ')}
                data-section={id}
              >
                {widget}
              </div>
            );
          }

          return (
            <SortableItem key={id} id={id} editMode={editMode} className={sc}>
              <div
                className={[
                  'overview-grid__cell',
                  'overview-grid__cell--editing',
                  isHidden ? 'overview-grid__cell--hidden' : '',
                ].filter(Boolean).join(' ')}
                data-section={id}
              >
                <div className="edit-section-outline">{widget}</div>
                <EditBadge
                  hidden={isHidden}
                  toggleLabel={isHidden ? `show ${SECTION_LABELS[id]}` : `hide ${SECTION_LABELS[id]}`}
                  onToggleHidden={() => handleToggleHidden(id)}
                  mobileHidden={isMobileHidden}
                  onToggleMobileHidden={() => handleToggleMobileHidden(id)}
                  mobileToggleLabel={isMobileHidden ? `show ${SECTION_LABELS[id]} on mobile` : `hide ${SECTION_LABELS[id]} on mobile`}
                />
                <SpanDots span={currentSpan} />
                <ResizeHandle id={id} span={currentSpan} onCommit={handleSpanChange} />
              </div>
            </SortableItem>
          );
        })}
      </SortableGrid>
    </div>
  );
}
