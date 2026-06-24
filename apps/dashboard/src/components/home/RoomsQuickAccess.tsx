/**
 * RoomsQuickAccess — grid of horizontal room summary cards.
 */
import React from 'react';
import { useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { Thermometer, Droplets, Lightbulb } from 'lucide-react';
import { roomSummary } from '@hapulse/core';
import type { Room, HassEntityMap } from '@hapulse/core';
import { RoomDisplayIcon } from '../ui/RoomDisplayIcon';
import { roomDisplayIcon } from '../../lib/roomIcon';
import { SectionLabel } from '../ui/SectionLabel';
import { useSettingsStore } from '../../stores/settingsStore';
import './RoomsQuickAccess.css';

interface RoomsQuickAccessProps {
  rooms: Room[];
  entities: HassEntityMap;
}

export function RoomsQuickAccess({ rooms, entities }: RoomsQuickAccessProps) {
  const navigate = useNavigate();
  const hiddenEntities = useSettingsStore(
    useShallow((s) => s.customization.hiddenEntities)
  );

  if (rooms.length === 0) return null;

  return (
    <section className="rooms-quick-section">
      <SectionLabel style={{ marginBottom: 0 }}>rooms</SectionLabel>
      <div className="rooms-quick-strip" role="list" aria-label="All rooms">
        {rooms.map((room) => {
          const summary = roomSummary(room, entities);
          const { iconName, isStatus } = roomDisplayIcon(room, entities, hiddenEntities);

          // Lights: visible (non-hidden) entities only
          const visibleLightIds = (room.domains['light'] ?? []).filter(
            (id) => !hiddenEntities.includes(id)
          );
          const visibleLightsOn = visibleLightIds.filter(
            (id) => entities[id]?.state === 'on'
          ).length;
          const lightsOn = visibleLightsOn > 0;

          const totalDevices = Object.values(room.domains).flat().length;
          const hasStats =
            summary.temperature != null ||
            summary.humidity != null ||
            visibleLightIds.length > 0;

          return (
            <button
              key={room.id}
              className={[
                'rooms-quick-tile',
                lightsOn ? 'rooms-quick-tile--active' : '',
                isStatus ? 'rooms-quick-tile--status' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => void navigate(`/room/${room.id}`)}
              aria-label={`${room.name} room`}
              role="listitem"
              type="button"
            >
              {/* Icon box */}
              <div className={[
                  'rooms-quick-tile__icon-box',
                  isStatus ? 'rooms-quick-tile__icon-box--status' : lightsOn ? 'rooms-quick-tile__icon-box--active' : '',
                ].filter(Boolean).join(' ')}>
                <RoomDisplayIcon
                  roomIcon={room.icon}
                  iconName={iconName}
                  isStatus={isStatus}
                  size={22}
                  className="rooms-quick-tile__icon"
                />
              </div>

              {/* Body: name + stats */}
              <div className="rooms-quick-tile__body">
                <span className="rooms-quick-tile__name">{room.name}</span>
                <div className="rooms-quick-tile__stats">
                  {summary.temperature != null && (
                    <div className="rooms-quick-tile__stat">
                      <span className="rooms-quick-tile__stat-value rooms-quick-tile__stat-value--temp">
                        <Thermometer size={11} strokeWidth={1.75} />
                        {Math.round(summary.temperature)}°
                      </span>
                      <span className="rooms-quick-tile__stat-label">temp</span>
                    </div>
                  )}
                  {summary.humidity != null && (
                    <div className="rooms-quick-tile__stat">
                      <span className="rooms-quick-tile__stat-value rooms-quick-tile__stat-value--humidity">
                        <Droplets size={11} strokeWidth={1.75} />
                        {Math.round(summary.humidity)}%
                      </span>
                      <span className="rooms-quick-tile__stat-label">humidity</span>
                    </div>
                  )}
                  {visibleLightIds.length > 0 && (
                    <div className="rooms-quick-tile__stat">
                      <span className={`rooms-quick-tile__stat-value${lightsOn ? ' rooms-quick-tile__stat-value--lit' : ''}`}>
                        <Lightbulb size={11} strokeWidth={1.75} />
                        {lightsOn ? visibleLightsOn : 'off'}
                      </span>
                      <span className="rooms-quick-tile__stat-label">lights</span>
                    </div>
                  )}
                  {/* Fallback: device count when no other stats are available */}
                  {!hasStats && (
                    <div className="rooms-quick-tile__stat">
                      <span className="rooms-quick-tile__stat-value">{totalDevices}</span>
                      <span className="rooms-quick-tile__stat-label">device{totalDevices !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
