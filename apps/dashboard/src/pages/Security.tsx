import React, { useCallback, useMemo } from 'react';
import { Shield, DoorOpen, Grid2x2, Activity, Scaling } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useEntityStore } from '../stores/entityStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { EmptyState } from '../components/ui/EmptyState';
import { EditToggle } from '../components/ui/EditToggle';
import { PageHeaderActions } from '../components/ui/PageHeaderActions';
import { EditBadge } from '../components/ui/EditBadge';
import { SortableGrid } from '../components/ui/SortableGrid';
import { SortableItem } from '../components/ui/SortableItem';
import { SecurityHeroCard } from '../components/security/SecurityHeroCard';
import { AlarmPanelCard } from '../components/security/AlarmPanelCard';
import { PeopleList } from '../components/security/PeopleList';
import { LocksSectionCard } from '../components/security/LocksSectionCard';
import { SensorSectionCard } from '../components/security/SensorSectionCard';
import { CameraGrid } from '../components/security/CameraGrid';
import { applyStoredOrder } from '../lib/order';
import type { HassEntity } from '@hapulse/core';
import './Page.css';
import './Security.css';

// ---------------------------------------------------------------------------
// Entity filters
// ---------------------------------------------------------------------------

const DOOR_CLASSES    = new Set(['door', 'garage_door']);
const WINDOW_CLASSES  = new Set(['window', 'opening']);
const MOTION_CLASSES  = new Set(['motion', 'occupancy', 'presence']);

function isDoor(e: HassEntity)    { const dc = e.attributes['device_class'] as string | undefined; return dc != null && DOOR_CLASSES.has(dc); }
function isWindow(e: HassEntity)  { const dc = e.attributes['device_class'] as string | undefined; return dc != null && WINDOW_CLASSES.has(dc); }
function isMotion(e: HassEntity)  { const dc = e.attributes['device_class'] as string | undefined; return dc != null && MOTION_CLASSES.has(dc); }

// ---------------------------------------------------------------------------
// Section config
// ---------------------------------------------------------------------------

const SECTION_IDS = ['security_hero', 'alarm_panel', 'cameras', 'people', 'locks', 'doors', 'windows', 'motion'] as const;
type SectionId = typeof SECTION_IDS[number];

const SECTION_LABELS: Record<SectionId, string> = {
  security_hero: 'Overview',
  alarm_panel:   'Alarm Panel',
  cameras:       'Cameras',
  people:        'People',
  locks:         'Locks',
  doors:         'Doors',
  windows:       'Windows',
  motion:        'Motion',
};

const MAX_COLS = 4;

const DEFAULT_SPANS: Record<string, number> = {
  security_hero: 2,
  alarm_panel:   2,
  cameras:       4,
  people:        1,
  locks:         2,
  doors:         1,
  windows:       1,
  motion:        1,
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
// SpanDots + ResizeHandle (same pattern as Scenes / Automations)
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

export function Security() {
  const { entities, rooms } = useEntityStore(
    useShallow((s) => ({ entities: s.entities, rooms: s.rooms }))
  );

  const hiddenEntities      = useSettingsStore((s) => s.customization.hiddenEntities);
  const entityOrder         = useSettingsStore((s) => s.customization.entityOrder);
  const securitySectionOrder = useSettingsStore(useShallow((s) => s.customization.securitySectionOrder));
  const hiddenSecuritySections = useSettingsStore(useShallow((s) => s.customization.hiddenSecuritySections));
  const mobileHiddenSecuritySections = useSettingsStore(useShallow((s) => s.customization.mobileHiddenSecuritySections));
  const securitySectionSpans = useSettingsStore(useShallow((s) => s.customization.securitySectionSpans));
  const updateCustomization = useSettingsStore((s) => s.updateCustomization);
  const editMode = useUIStore((s) => s.editMode);

  const allEntities = useMemo(() => Object.values(entities), [entities]);

  // Raw entity lists (before visibility filter)
  const alarm       = allEntities.find((e) => e.entity_id.startsWith('alarm_control_panel.'));
  const allPeople   = allEntities.filter((e) => e.entity_id.startsWith('person.'));
  const allCameras  = allEntities.filter((e) => e.entity_id.startsWith('camera.'));
  const allBinary   = allEntities.filter((e) => e.entity_id.startsWith('binary_sensor.'));
  const allLocks    = allEntities.filter((e) => e.entity_id.startsWith('lock.'));
  const allDoors    = allBinary.filter(isDoor);
  const allWindows  = allBinary.filter(isWindow);
  const allMotion   = allBinary.filter(isMotion);

  // Visibility filter
  function filterVisible<T extends HassEntity>(list: T[]): T[] {
    if (editMode) return list;
    return list.filter((e) => !hiddenEntities.includes(e.entity_id));
  }

  // Apply stored entity ordering for cameras (re-use existing __security:cameras key)
  const orderedCameraIds = applyStoredOrder(
    allCameras.map((e) => e.entity_id),
    entityOrder['__security:cameras']
  );
  const orderedCameras = orderedCameraIds
    .map((id) => entities[id])
    .filter((e): e is HassEntity => e !== undefined);

  const cameras = filterVisible(orderedCameras);
  const people  = filterVisible(allPeople);
  const locks   = filterVisible(allLocks);
  const doors   = filterVisible(allDoors);
  const windows = filterVisible(allWindows);
  const motion  = filterVisible(allMotion);

  // Decide which sections exist (only show sections that have data or in edit mode)
  const hasAlarm   = !!alarm;
  const hasCameras = editMode ? allCameras.length > 0 : cameras.length > 0;
  const hasPeople  = editMode ? allPeople.length > 0  : people.length > 0;
  const hasLocks   = editMode ? allLocks.length > 0   : locks.length > 0;
  const hasDoors   = editMode ? allDoors.length > 0   : doors.length > 0;
  const hasWindows = editMode ? allWindows.length > 0  : windows.length > 0;
  const hasMotion  = editMode ? allMotion.length > 0   : motion.length > 0;

  const sectionExists: Record<SectionId, boolean> = {
    security_hero: true, // always show if any data
    alarm_panel:   hasAlarm,
    cameras:       hasCameras,
    people:        hasPeople,
    locks:         hasLocks,
    doors:         hasDoors,
    windows:       hasWindows,
    motion:        hasMotion,
  };

  const totalEntities = allCameras.length + allPeople.length + allLocks.length +
    allDoors.length + allWindows.length + allMotion.length + (alarm ? 1 : 0);

  const allSectionIds  = SECTION_IDS.filter((id) => sectionExists[id]) as SectionId[];
  const orderedIds     = applyStoredOrder(allSectionIds, securitySectionOrder) as SectionId[];
  const visibleIds     = (editMode
    ? orderedIds
    : orderedIds.filter((id) => !hiddenSecuritySections.includes(id))) as SectionId[];

  const handleToggleHidden = useCallback((id: string) => {
    const next = hiddenSecuritySections.includes(id)
      ? hiddenSecuritySections.filter((s) => s !== id)
      : [...hiddenSecuritySections, id];
    updateCustomization({ hiddenSecuritySections: next });
  }, [hiddenSecuritySections, updateCustomization]);

  const handleToggleMobileHidden = useCallback((id: string) => {
    const next = mobileHiddenSecuritySections.includes(id)
      ? mobileHiddenSecuritySections.filter((s) => s !== id)
      : [...mobileHiddenSecuritySections, id];
    updateCustomization({ mobileHiddenSecuritySections: next });
  }, [mobileHiddenSecuritySections, updateCustomization]);

  const handleSpanChange = useCallback((id: string, newSpan: number) => {
    updateCustomization({
      securitySectionSpans: { ...securitySectionSpans, [id]: newSpan },
    });
  }, [securitySectionSpans, updateCustomization]);

  const handleReorder = useCallback((newOrder: string[]) => {
    updateCustomization({ securitySectionOrder: newOrder });
  }, [updateCustomization]);

  // Empty state
  if (totalEntities === 0) {
    return (
      <div className="page security-page stagger-rise">
        <div className="page__header-row">
          <h1 className="page__title">Security</h1>
          <PageHeaderActions />
        </div>
        <EmptyState
          icon={<Shield size={40} strokeWidth={1.5} />}
          title="nothing to secure yet"
          description="Add an alarm panel, cameras, door sensors, or locks in Home Assistant."
        />
      </div>
    );
  }

  function renderWidget(id: SectionId): React.ReactNode {
    switch (id) {
      case 'security_hero':
        return (
          <SecurityHeroCard
            alarm={alarm}
            people={people}
            locks={locks}
            doorSensors={doors}
            windowSensors={windows}
            motionSensors={motion}
            cameras={cameras}
          />
        );
      case 'alarm_panel':
        return alarm
          ? <AlarmPanelCard entity={alarm} />
          : null;
      case 'cameras':
        return (
          <div className="security-page__camera-section">
            <div className="security-page__camera-grid">
              <CameraGrid cameras={cameras} rooms={rooms} motionSensors={allMotion} />
            </div>
          </div>
        );
      case 'people':
        return <PeopleList people={people} />;
      case 'locks':
        return <LocksSectionCard locks={locks} rooms={rooms} />;
      case 'doors':
        return (
          <SensorSectionCard
            title="Doors"
            icon={<DoorOpen size={16} strokeWidth={1.75} />}
            sensors={doors}
            rooms={rooms}
            type="door"
            alertCount={doors.filter((s) => s.state === 'on').length}
          />
        );
      case 'windows':
        return (
          <SensorSectionCard
            title="Windows"
            icon={<Grid2x2 size={16} strokeWidth={1.75} />}
            sensors={windows}
            rooms={rooms}
            type="window"
            alertCount={windows.filter((s) => s.state === 'on').length}
          />
        );
      case 'motion':
        return (
          <SensorSectionCard
            title="Motion"
            icon={<Activity size={16} strokeWidth={1.75} />}
            sensors={motion}
            rooms={rooms}
            type="motion"
            alertCount={motion.filter((s) => s.state === 'on').length}
          />
        );
    }
  }

  return (
    <div className="page security-page stagger-rise">
      <div className="page__header-row">
        <h1 className="page__title">Security</h1>
        <PageHeaderActions><EditToggle /></PageHeaderActions>
      </div>

      <SortableGrid
        items={visibleIds}
        onReorder={handleReorder}
        editMode={editMode}
        className="overview-grid"
      >
        {visibleIds.map((id) => {
          const isHidden       = hiddenSecuritySections.includes(id);
          const isMobileHidden = mobileHiddenSecuritySections.includes(id);
          const currentSpan = getSpan(id, securitySectionSpans);
          const sc          = spanClass(currentSpan);
          const widget      = renderWidget(id);

          if (!widget) return null;

          if (!editMode) {
            return (
              <div
                key={id}
                className={['overview-grid__cell', sc, isHidden ? 'overview-grid__cell--hidden' : '', isMobileHidden ? 'section-mobile-hidden' : ''].filter(Boolean).join(' ')}
                data-section={id}
              >
                {widget}
              </div>
            );
          }

          return (
            <SortableItem key={id} id={id} editMode={editMode} className={sc}>
              <div
                className={['overview-grid__cell', 'overview-grid__cell--editing', isHidden ? 'overview-grid__cell--hidden' : ''].filter(Boolean).join(' ')}
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
