/**
 * DevicesCard — favorited, currently-active controllable entities.
 * Shows only entities the user has starred that are currently on/playing/cleaning.
 */
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Lightbulb, Plug, Fan, Speaker, Tv, ChevronRight, RefreshCw, Layers, Star,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { domainOf, isToggleable, formatEntityState } from '@hapulse/core';
import type { HassEntityMap, HassEntity, Room } from '@hapulse/core';
import { callService } from '../../ha/service';
import './DevicesCard.css';

interface DevicesCardProps {
  entities: HassEntityMap;
  rooms: Room[];
  favorites: string[];
}

const DEVICE_DOMAINS = ['light', 'switch', 'fan', 'media_player', 'vacuum'];

/** True when a device should be considered "on" / active */
function isActiveState(entity: HassEntity): boolean {
  const { state } = entity;
  if (state === 'unavailable' || state === 'unknown') return false;
  const domain = domainOf(entity.entity_id);
  if (domain === 'media_player') return state === 'playing' || state === 'paused';
  if (domain === 'vacuum') return state === 'cleaning' || state === 'returning';
  return state === 'on';
}

/** Icon chip appearance based on domain and state */
function deviceIconChip(entity: HassEntity): { icon: React.ReactNode; bg: string; color: string } {
  const domain = domainOf(entity.entity_id);
  switch (domain) {
    case 'light':
      return { icon: <Lightbulb size={16} strokeWidth={1.75} />, bg: 'var(--accent-soft)', color: 'var(--accent)' };
    case 'switch':
      return { icon: <Plug size={16} strokeWidth={1.75} />, bg: 'var(--accent-soft)', color: 'var(--accent)' };
    case 'fan':
      return { icon: <Fan size={16} strokeWidth={1.75} />, bg: 'var(--accent-soft)', color: 'var(--accent)' };
    case 'media_player':
      return {
        icon: entity.state === 'playing' ? <Tv size={16} strokeWidth={1.75} /> : <Speaker size={16} strokeWidth={1.75} />,
        bg: 'var(--info-soft)',
        color: 'var(--info)',
      };
    case 'vacuum':
      return { icon: <RefreshCw size={16} strokeWidth={1.75} />, bg: 'var(--positive-soft)', color: 'var(--positive)' };
    default:
      return { icon: <Plug size={16} strokeWidth={1.75} />, bg: 'var(--bg-subtle)', color: 'var(--text-faint)' };
  }
}

function statusLabel(entity: HassEntity): string {
  const domain = domainOf(entity.entity_id);
  const { state } = entity;
  switch (domain) {
    case 'vacuum':
      if (state === 'cleaning') return 'Cleaning';
      if (state === 'returning') return 'Returning';
      return state;
    case 'media_player':
      if (state === 'playing') return 'Playing';
      if (state === 'paused') return 'Paused';
      return state;
    default:
      return formatEntityState(entity);
  }
}

function findRoomName(entityId: string, rooms: Room[]): string | undefined {
  for (const room of rooms) {
    if (room.entityIds.includes(entityId)) return room.name;
  }
  return undefined;
}

export function DevicesCard({ entities, rooms, favorites }: DevicesCardProps) {
  const navigate = useNavigate();

  // All favorited device entities (available, right domain)
  const favDevices = favorites
    .map((id) => entities[id])
    .filter((e): e is HassEntity =>
      !!e && DEVICE_DOMAINS.includes(domainOf(e.entity_id)) && e.state !== 'unavailable'
    );

  // Subset that are currently on/active
  const activeDevices = favDevices.filter(isActiveState);

  const handleToggle = useCallback((entity: HassEntity) => {
    const domain = domainOf(entity.entity_id);
    if (!isToggleable(domain)) return;
    void callService(domain, 'toggle', {}, { entity_id: entity.entity_id });
  }, []);

  const scrollable = activeDevices.length > 5;

  const emptySubText = favDevices.length === 0
    ? 'Open a room, tap edit, and star a device to track it here.'
    : 'All your favorites are off right now.';

  return (
    <Card className="devices-card">
      <div className="devices-card__header">
        <div className="devices-card__title-row">
          <span className="devices-card__icon-chip" aria-hidden="true">
            <Layers size={16} strokeWidth={1.75} />
          </span>
          <span className="devices-card__title">Devices</span>
        </div>
        {activeDevices.length > 0 && (
          <button
            className="devices-card__all-link"
            onClick={() => void navigate('/devices')}
            type="button"
            aria-label="View all devices"
          >
            All Devices
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        )}
      </div>

      {activeDevices.length === 0 ? (
        <div className="devices-card__empty">
          <Star size={28} strokeWidth={1.5} className="devices-card__empty-icon" />
          <p className="devices-card__empty-text">No active devices</p>
          <p className="devices-card__empty-sub">{emptySubText}</p>
        </div>
      ) : (
        <ul
          className={`devices-card__list${scrollable ? ' devices-card__list--scrollable' : ''}`}
          aria-label="Active favorite devices"
        >
          {activeDevices.map((entity) => {
            const chip = deviceIconChip(entity);
            const name = (entity.attributes.friendly_name ?? entity.entity_id.split('.')[1]!).replace(/_/g, ' ');
            const roomName = findRoomName(entity.entity_id, rooms);
            const domain = domainOf(entity.entity_id);
            const toggleable = isToggleable(domain);
            const isOn = isActiveState(entity);

            return (
              <li key={entity.entity_id} className="device-row">
                <span className="device-row__icon" style={{ background: chip.bg, color: chip.color }} aria-hidden="true">
                  {chip.icon}
                </span>
                <div className="device-row__info">
                  <span className="device-row__name">{name}</span>
                  {roomName && <span className="device-row__room">{roomName}</span>}
                </div>
                <div className="device-row__control">
                  {toggleable ? (
                    <button
                      className={`device-toggle${isOn ? ' device-toggle--on' : ''}`}
                      onClick={() => handleToggle(entity)}
                      aria-label={`${isOn ? 'Turn off' : 'Turn on'} ${name}`}
                      aria-pressed={isOn}
                      role="switch"
                      type="button"
                    >
                      <span className="device-toggle__thumb" />
                    </button>
                  ) : (
                    <span className="device-row__status">{statusLabel(entity)}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
