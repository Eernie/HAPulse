/**
 * Device model — framework-agnostic.
 *
 * Joins the device registry with the entity registry, area registry and live
 * states to produce per-device view models for the Devices page. A "device" is a
 * Home Assistant device-registry entry; its entities are the registry entries
 * whose `device_id` points at it.
 */

import { domainOf } from './domain.js';
import type { Registries, HassEntityMap, EntityRegistryEntry } from './types.js';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** Domains that represent something the user can actively control. */
const CONTROL_DOMAINS = new Set([
  'light', 'switch', 'fan', 'input_boolean', 'climate', 'cover', 'lock',
  'media_player', 'vacuum', 'button', 'humidifier', 'valve', 'siren',
  'number', 'select', 'input_number', 'input_select', 'input_button',
  'scene', 'script', 'lawn_mower', 'water_heater', 'alarm_control_panel',
]);

export type DeviceEntityCategory = 'controls' | 'sensors' | 'diagnostic' | 'config';

/** Classify an entity for grouping inside the device details modal. */
export function deviceEntityCategory(
  domain: string,
  entityCategory: 'config' | 'diagnostic' | null | undefined,
): DeviceEntityCategory {
  if (entityCategory === 'diagnostic') return 'diagnostic';
  if (entityCategory === 'config') return 'config';
  return CONTROL_DOMAINS.has(domain) ? 'controls' : 'sensors';
}

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

export interface DeviceEntityRef {
  entity_id: string;
  domain: string;
  name: string;
  category: DeviceEntityCategory;
}

export interface DeviceModel {
  id: string;
  name: string;
  areaId: string | null;
  areaName: string | null;
  manufacturer: string | null;
  model: string | null;
  /** Primary integration (most common entity platform). */
  integration: string | null;
  /** All distinct integrations contributing entities to this device. */
  integrations: string[];
  /** Dominant domain — used to pick the device icon. */
  primaryDomain: string | null;
  entities: DeviceEntityRef[];
  entityCount: number;
}

export interface DevicesSummary {
  integrations: number;
  devices: number;
  entities: number;
  rooms: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function prettyTail(entityId: string): string {
  const tail = entityId.split('.')[1] ?? entityId;
  return tail.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function mostCommon<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const counts = new Map<T, number>();
  let best: T = items[0]!;
  let bestN = 0;
  for (const it of items) {
    const n = (counts.get(it) ?? 0) + 1;
    counts.set(it, n);
    if (n > bestN) { bestN = n; best = it; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build the list of device view models.
 *
 * Excludes disabled and hidden entities. Devices that end up with no visible
 * entities are omitted. Structure depends only on the registries + hidden list,
 * not live states (read those at render time), so this is cheap to memoise.
 */
export function buildDeviceModels(
  registries: Registries,
  entities: HassEntityMap,
  hiddenEntityIds: string[] = [],
): DeviceModel[] {
  const areaName = new Map(registries.areas.map((a) => [a.area_id, a.name]));
  const hidden = new Set(hiddenEntityIds);

  // Group eligible entity-registry entries by device_id.
  const byDevice = new Map<string, EntityRegistryEntry[]>();
  for (const re of registries.entities) {
    if (!re.device_id) continue;
    if (re.disabled_by) continue;
    if (hidden.has(re.entity_id)) continue;
    if (!entities[re.entity_id]) continue; // must have a live state to show/interact
    const list = byDevice.get(re.device_id);
    if (list) list.push(re);
    else byDevice.set(re.device_id, [re]);
  }

  const models: DeviceModel[] = [];
  for (const dev of registries.devices) {
    const ents = byDevice.get(dev.id);
    if (!ents || ents.length === 0) continue;

    let areaId = dev.area_id;
    if (!areaId) {
      areaId = mostCommon(ents.map((e) => e.area_id).filter((a): a is string => !!a));
    }

    const platforms = ents.map((e) => e.platform).filter((p): p is string => !!p);
    const integration = mostCommon(platforms);
    const integrations = [...new Set(platforms)];

    const domains = ents.map((e) => domainOf(e.entity_id));
    const controlDomains = domains.filter((d) => CONTROL_DOMAINS.has(d));
    const primaryDomain = mostCommon(controlDomains.length ? controlDomains : domains);

    const entityRefs: DeviceEntityRef[] = ents.map((re) => {
      const domain = domainOf(re.entity_id);
      return {
        entity_id: re.entity_id,
        domain,
        name:
          (entities[re.entity_id]?.attributes.friendly_name as string | undefined) ??
          re.original_name ??
          prettyTail(re.entity_id),
        category: deviceEntityCategory(domain, re.entity_category),
      };
    });

    models.push({
      id: dev.id,
      name: dev.name_by_user ?? dev.name ?? 'Device',
      areaId: areaId ?? null,
      areaName: areaId ? (areaName.get(areaId) ?? null) : null,
      manufacturer: dev.manufacturer ?? null,
      model: dev.model ?? null,
      integration,
      integrations,
      primaryDomain,
      entities: entityRefs,
      entityCount: entityRefs.length,
    });
  }

  models.sort((a, b) => {
    const an = a.areaName ?? '￿';
    const bn = b.areaName ?? '￿';
    return an.localeCompare(bn) || a.name.localeCompare(b.name);
  });

  return models;
}

/** Aggregate the dashboard summary counts from the device models. */
export function summarizeDevices(models: DeviceModel[]): DevicesSummary {
  const integrations = new Set<string>();
  const rooms = new Set<string>();
  let entities = 0;
  for (const m of models) {
    for (const i of m.integrations) integrations.add(i);
    if (m.areaId) rooms.add(m.areaId);
    entities += m.entityCount;
  }
  return {
    integrations: integrations.size,
    devices: models.length,
    entities,
    rooms: rooms.size,
  };
}
