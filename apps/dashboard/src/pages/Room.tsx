import React, { useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ChevronLeft, GripVertical,
  Sparkles, Sun, Moon, Coffee, Tv, Music2, Sunset, PartyPopper, BookOpen,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionLabel } from '../components/ui/SectionLabel';
import { IconButton } from '../components/ui/IconButton';
import { EditToggle } from '../components/ui/EditToggle';
import { PageHeaderActions } from '../components/ui/PageHeaderActions';
import { EditBadge } from '../components/ui/EditBadge';
import { SortableGrid } from '../components/ui/SortableGrid';
import { SortableItem } from '../components/ui/SortableItem';
import { EntityCard } from '../components/cards/EntityCard';
import { LightCard } from '../components/cards/LightCard';
import { ClimateCard } from '../components/cards/ClimateCard';
import { MediaCard } from '../components/cards/MediaCard';
import { CoverCard } from '../components/cards/CoverCard';
import { ToggleCard } from '../components/cards/ToggleCard';
import { SensorTile } from '../components/cards/SensorTile';
import { ButtonCard } from '../components/cards/ButtonCard';
import { VacuumCard } from '../components/cards/VacuumCard';
import { HeroRoomCard } from '../components/home/HeroRoomCard';
import { callService } from '../ha/service';
import { useRoom, useEntityMap, useCustomization } from '../ha/hooks';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { applyStoredOrder } from '../lib/order';
import './Page.css';
import './Room.css';

// ── Entity name helpers ───────────────────────────────────────────────────────

function stripRoomName(name: string, roomName: string): string {
  if (!roomName) return name;
  const escaped = roomName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const stripped = name
    .replace(new RegExp(`\\b${escaped}\\b`, 'ig'), ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return stripped.length > 0 ? stripped : name;
}

// ── Scene helpers ─────────────────────────────────────────────────────────────

const SCENE_ICON_COLORS = [
  { bg: 'var(--accent-soft)', color: 'var(--accent)' },
  { bg: 'var(--info-soft)', color: 'var(--info)' },
  { bg: 'var(--positive-soft)', color: 'var(--positive)' },
  { bg: 'var(--warning-soft)', color: 'var(--warning)' },
] as const;

function sceneIcon(name: string): React.ReactNode {
  const n = name.toLowerCase();
  if (n.includes('morning') || n.includes('sunrise') || n.includes('wake')) return <Sun size={16} strokeWidth={1.75} />;
  if (n.includes('night') || n.includes('sleep') || n.includes('bed')) return <Moon size={16} strokeWidth={1.75} />;
  if (n.includes('relax') || n.includes('chill') || n.includes('calm')) return <Sunset size={16} strokeWidth={1.75} />;
  if (n.includes('movie') || n.includes('cinema') || n.includes('tv')) return <Tv size={16} strokeWidth={1.75} />;
  if (n.includes('music') || n.includes('party')) return <PartyPopper size={16} strokeWidth={1.75} />;
  if (n.includes('read') || n.includes('study') || n.includes('focus')) return <BookOpen size={16} strokeWidth={1.75} />;
  if (n.includes('coffee') || n.includes('breakfast')) return <Coffee size={16} strokeWidth={1.75} />;
  if (n.includes('concert') || n.includes('audio') || n.includes('sound')) return <Music2 size={16} strokeWidth={1.75} />;
  return <Sparkles size={16} strokeWidth={1.75} />;
}

// ── Sortable section wrapper ──────────────────────────────────────────────────

function SortableSectionInner({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <section
      ref={setNodeRef}
      className={[
        'room-page__section',
        isDragging ? 'room-page__section--dragging' : '',
      ].filter(Boolean).join(' ')}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
      }}
      {...attributes}
    >
      <div className="room-section__label-row">
        <button
          ref={setActivatorNodeRef}
          className="room-section__grip"
          type="button"
          aria-label={`Drag to reorder ${label} section`}
          {...listeners}
        >
          <GripVertical size={14} strokeWidth={1.75} />
        </button>
        <SectionLabel>{label}</SectionLabel>
      </div>
      {children}
    </section>
  );
}

// ── Section config ────────────────────────────────────────────────────────────

const SECTION_ORDER = [
  'scene',
  'light',
  'climate',
  'media_player',
  'cover',
  'switches',
  'button',
  'vacuum',
  'sensor',
  'binary_sensor',
  'other',
] as const;

type SectionKey = (typeof SECTION_ORDER)[number];

const SECTION_LABELS: Record<string, string> = {
  scene:        'Scenes',
  light:        'Lights',
  climate:      'Climate',
  media_player: 'Media',
  cover:        'Blinds',
  switches:     'Switches',
  button:       'Buttons',
  vacuum:       'Vacuums',
  sensor:       'Sensors',
  binary_sensor:'Sensors',
  other:        'Other',
};

const SWITCH_DOMAINS = new Set(['switch', 'fan', 'input_boolean']);
const CORE_DOMAINS = new Set([
  'scene', 'light', 'climate', 'media_player', 'cover',
  'switch', 'fan', 'input_boolean', 'button', 'vacuum',
  'sensor', 'binary_sensor',
]);


// ── Component ─────────────────────────────────────────────────────────────────

export function Room() {
  const { areaId } = useParams<{ areaId: string }>();
  const navigate = useNavigate();
  const room = useRoom(areaId ?? '');
  const entities = useEntityMap();
  const customization = useCustomization();
  const editMode = useUIStore((s) => s.editMode);
  const updateCustomization = useSettingsStore((s) => s.updateCustomization);
  const { hiddenEntities, entityOverrides, entityOrder, favorites, roomSectionOrder } = customization;

  if (!areaId || !room) {
    return (
      <div className="page room-page stagger-rise">
        <div className="room-page__not-found">
          <div className="room-page__not-found-title">room not found</div>
          <button
            type="button"
            className="room-page__not-found-link"
            onClick={() => void navigate('/')}
          >
            ← back to home
          </button>
        </div>
      </div>
    );
  }

  function handleToggleEntity(entityId: string) {
    const next = hiddenEntities.includes(entityId)
      ? hiddenEntities.filter((id) => id !== entityId)
      : [...hiddenEntities, entityId];
    updateCustomization({ hiddenEntities: next });
  }

  function handleToggleFavorite(entityId: string) {
    const next = favorites.includes(entityId)
      ? favorites.filter((id) => id !== entityId)
      : [...favorites, entityId];
    updateCustomization({ favorites: next });
  }

  function handleReorderSection(
    sectionKey: string,
    newSectionIds: string[],
    sectionsSnap: Record<string, string[]>
  ) {
    if (!areaId) return;
    const combined: string[] = [];
    for (const key of SECTION_ORDER) {
      if (key === sectionKey) {
        combined.push(...newSectionIds);
      } else if (sectionsSnap[key]) {
        combined.push(...sectionsSnap[key]!);
      }
    }
    updateCustomization({ entityOrder: { ...entityOrder, [areaId]: combined } });
  }

  const handleReorderSections = useCallback(
    (newKeys: string[]) => {
      if (!areaId) return;
      updateCustomization({
        roomSectionOrder: { ...roomSectionOrder, [areaId]: newKeys },
      });
    },
    [areaId, roomSectionOrder, updateCustomization]
  );

  // Gather domain → ids
  const domainMap: Record<string, string[]> = {};
  for (const [domain, ids] of Object.entries(room.domains)) {
    const filtered = editMode
      ? ids.filter((id) => id in entities)
      : ids.filter((id) => !hiddenEntities.includes(id) && id in entities);
    if (filtered.length > 0) {
      domainMap[domain] = filtered;
    }
  }

  // Group switch and other ids
  const switchIds: string[] = [];
  const otherIds: string[] = [];
  for (const domain of Object.keys(domainMap)) {
    if (SWITCH_DOMAINS.has(domain)) {
      switchIds.push(...(domainMap[domain] ?? []));
    } else if (!CORE_DOMAINS.has(domain)) {
      otherIds.push(...(domainMap[domain] ?? []));
    }
  }

  function getEntityName(entityId: string): string {
    const override = entityOverrides[entityId];
    if (override?.name) return override.name;
    const friendly = entities[entityId]?.attributes?.friendly_name as string | undefined;
    if (friendly) return stripRoomName(friendly, room?.name ?? '');
    return entityId;
  }

  const storedAreaOrder = entityOrder[areaId];
  function orderedIds(raw: string[]): string[] {
    return applyStoredOrder(raw, storedAreaOrder?.filter((id) => raw.includes(id)));
  }

  const sceneIds        = orderedIds(domainMap['scene']        ?? []);
  const lightIds        = orderedIds(domainMap['light']        ?? []);
  const climateIds      = orderedIds(domainMap['climate']      ?? []);
  const mediaIds        = orderedIds(domainMap['media_player'] ?? []);
  const coverIds        = orderedIds(domainMap['cover']        ?? []);
  const buttonIds       = orderedIds(domainMap['button']       ?? []);
  const vacuumIds       = orderedIds(domainMap['vacuum']       ?? []);
  const orderedSwitchIds = orderedIds(switchIds);
  const rawSensorIds = [...(domainMap['sensor'] ?? []), ...(domainMap['binary_sensor'] ?? [])];
  const sensorIds       = orderedIds(rawSensorIds);
  const orderedOtherIds = orderedIds(otherIds);

  const sectionsSnap: Record<string, string[]> = {
    scene:        sceneIds,
    light:        lightIds,
    climate:      climateIds,
    media_player: mediaIds,
    cover:        coverIds,
    switches:     orderedSwitchIds,
    button:       buttonIds,
    vacuum:       vacuumIds,
    sensor:       sensorIds,
    binary_sensor:[],
    other:        orderedOtherIds,
  };

  // ── Card renderer ───────────────────────────────────────────────────────────

  function renderCard(key: SectionKey, entityId: string, isSensor: boolean, idx: number) {
    const entity = entities[entityId];
    if (!entity) return null;
    const name = getEntityName(entityId);
    const isHidden = hiddenEntities.includes(entityId);

    const cardNode: React.ReactNode = (() => {
      if (isSensor) return <SensorTile key={entityId} entity={entity} name={name} />;
      if (key === 'scene') {
        const palette = SCENE_ICON_COLORS[idx % SCENE_ICON_COLORS.length]!;
        const displayName = name.replace(/_/g, ' ');
        return (
          <button
            key={entityId}
            className={['scene-tile', 'scene-tile--compact', isHidden && editMode ? 'scene-tile--hidden' : ''].filter(Boolean).join(' ')}
            onClick={() => void callService('scene', 'turn_on', {}, { entity_id: entityId })}
            aria-label={`Activate scene: ${displayName}`}
            type="button"
          >
            <span className="scene-tile__icon" style={{ background: palette.bg, color: palette.color }} aria-hidden="true">
              {sceneIcon(displayName)}
            </span>
            <span className="scene-tile__name">{displayName}</span>
          </button>
        );
      }
      switch (key) {
        case 'light':        return <LightCard   key={entityId} entity={entity} name={name} />;
        case 'climate':      return <ClimateCard  key={entityId} entity={entity} name={name} />;
        case 'media_player': return <MediaCard    key={entityId} entity={entity} name={name} />;
        case 'cover':        return <CoverCard    key={entityId} entity={entity} name={name} />;
        case 'switches':     return <ToggleCard   key={entityId} entity={entity} name={name} />;
        case 'button':       return <ButtonCard   key={entityId} entity={entity} name={name} />;
        case 'vacuum':       return <VacuumCard   key={entityId} entity={entity} name={name} />;
        default:             return <EntityCard   key={entityId} entity={entity} name={name} />;
      }
    })();

    const isUnavailable = entity.state === 'unavailable';
    const finalNode = isUnavailable
      ? <div key={entityId} className="entity-unavailable">{cardNode}</div>
      : cardNode;

    if (!editMode) return finalNode;

    return (
      <SortableItem key={entityId} id={entityId} editMode={editMode}>
        <div
          className={[
            'edit-entity-wrap',
            'edit-entity-wrap--editing',
            isHidden ? 'edit-entity-wrap--hidden' : '',
            isUnavailable ? 'edit-entity-wrap--unavailable' : '',
          ].filter(Boolean).join(' ')}
        >
          <div className="edit-item-outline" style={{ borderRadius: 'var(--radius-card)' }}>
            {cardNode}
          </div>
          <EditBadge
            hidden={isHidden}
            toggleLabel={isHidden ? `show ${name}` : `hide ${name}`}
            onToggleHidden={() => handleToggleEntity(entityId)}
            favorite={favorites.includes(entityId)}
            onToggleFavorite={() => handleToggleFavorite(entityId)}
            entityName={name}
          />
        </div>
      </SortableItem>
    );
  }

  // ── Section data ────────────────────────────────────────────────────────────

  type SectionDef = {
    key: SectionKey;
    label: string;
    ids: string[];
    isSensor?: boolean;
  };

  const allSectionDefs: SectionDef[] = [
    { key: 'scene',        label: SECTION_LABELS['scene']!,        ids: sceneIds },
    { key: 'light',        label: SECTION_LABELS['light']!,        ids: lightIds },
    { key: 'climate',      label: SECTION_LABELS['climate']!,      ids: climateIds },
    { key: 'media_player', label: SECTION_LABELS['media_player']!, ids: mediaIds },
    { key: 'cover',        label: SECTION_LABELS['cover']!,        ids: coverIds },
    { key: 'switches',     label: SECTION_LABELS['switches']!,     ids: orderedSwitchIds },
    { key: 'button',       label: SECTION_LABELS['button']!,       ids: buttonIds },
    { key: 'vacuum',       label: SECTION_LABELS['vacuum']!,       ids: vacuumIds },
    { key: 'sensor',       label: SECTION_LABELS['sensor']!,       ids: sensorIds, isSensor: true },
    { key: 'other',        label: SECTION_LABELS['other']!,        ids: orderedOtherIds },
  ];

  const activeSectionDefs = allSectionDefs.filter((s) => s.ids.length > 0);

  const storedRoomSectionOrder = roomSectionOrder[areaId];
  const orderedSectionDefs = applyStoredOrder(
    activeSectionDefs.map((s) => s.key),
    storedRoomSectionOrder
  )
    .map((key) => activeSectionDefs.find((s) => s.key === key))
    .filter((s): s is SectionDef => s != null);

  // ── Section content renderer ────────────────────────────────────────────────

  function renderSectionContent(s: SectionDef): React.ReactNode {
    const { key, ids, isSensor } = s;
    const gridClass = isSensor
      ? 'room-page__sensor-grid'
      : key === 'scene'
      ? 'room-page__scene-grid'
      : key === 'climate' || key === 'vacuum'
      ? 'room-page__wide-card-grid'
      : 'room-page__card-grid';

    return (
      <SortableGrid
        items={ids}
        onReorder={(newIds) => handleReorderSection(key, newIds, sectionsSnap)}
        editMode={editMode}
        className={gridClass}
      >
        {ids.map((entityId, idx) => renderCard(key, entityId, isSensor ?? false, idx))}
      </SortableGrid>
    );
  }

  const isEmpty = orderedSectionDefs.length === 0;

  return (
    <div className="page room-page stagger-rise">
      {/* Mobile-only top bar: back + edit toggle (desktop uses AppLayout header) */}
      <div className="room-page__header">
        <IconButton
          label="Back"
          size={40}
          variant="ghost"
          onClick={() => void navigate(-1)}
        >
          <ChevronLeft size={20} strokeWidth={1.75} />
        </IconButton>
        <PageHeaderActions>
          <EditToggle className="room-page__edit-toggle" />
        </PageHeaderActions>
      </div>

      {/* Hero room card */}
      <HeroRoomCard rooms={[room]} entities={entities} />

      {/* Sections */}
      {isEmpty ? (
        <div className="room-page__not-found">
          <div className="room-page__not-found-title">no entities in this room</div>
          <button
            type="button"
            className="room-page__not-found-link"
            onClick={() => void navigate('/')}
          >
            ← back to home
          </button>
        </div>
      ) : editMode ? (
        <SortableGrid
          items={orderedSectionDefs.map((s) => s.key)}
          onReorder={handleReorderSections}
          editMode={editMode}
          className="room-page__sections"
        >
          {orderedSectionDefs.map((s) => (
            <SortableSectionInner
              key={s.key}
              id={s.key}
              label={s.label}
            >
              {renderSectionContent(s)}
            </SortableSectionInner>
          ))}
        </SortableGrid>
      ) : (
        <div className="room-page__sections">
          {orderedSectionDefs.map((s) => (
            <section key={s.key} className="room-page__section">
              <SectionLabel>{s.label}</SectionLabel>
              {renderSectionContent(s)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
