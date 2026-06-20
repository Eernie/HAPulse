import React from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import type { HassEntity } from '@hapulse/core';
import './SceneActivityFeed.css';

interface SceneActivityFeedProps {
  scenes: HassEntity[];
  /** area_id → { name } for room name pills. */
  areaMap: Record<string, { name: string; icon: string }>;
  /** entity_id → area_id */
  entityAreaMap: Record<string, string | null>;
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso || iso === 'unknown') return 'Never';
  try {
    const delta = Date.now() - new Date(iso).getTime();
    if (delta < 60000) return 'Just now';
    if (delta < 3600000) return `${Math.floor(delta / 60000)}m ago`;
    if (delta < 86400000) return `${Math.floor(delta / 3600000)}h ago`;
    if (delta < 172800000) return 'Yesterday';
    return `${Math.floor(delta / 86400000)}d ago`;
  } catch {
    return '—';
  }
}

function sceneName(e: HassEntity): string {
  return (
    (e.attributes.friendly_name as string | undefined) ??
    e.entity_id.split('.')[1]!.replace(/_/g, ' ')
  );
}

export function SceneActivityFeed({ scenes, areaMap, entityAreaMap }: SceneActivityFeedProps) {
  const recent = scenes
    .filter((e) => e.state !== 'unknown')
    .sort((a, b) => {
      try {
        return new Date(b.state).getTime() - new Date(a.state).getTime();
      } catch {
        return 0;
      }
    })
    .slice(0, 8);

  return (
    <Card className="scene-feed-card">
      <div className="scene-feed-card__header">
        <div className="scene-feed-card__title-row">
          <span className="scene-feed-card__icon-chip" aria-hidden="true">
            <Clock size={15} strokeWidth={1.75} />
          </span>
          <span className="scene-feed-card__title">Recent Activity</span>
        </div>
        <span className="scene-feed-card__sub">{recent.length} used today</span>
      </div>

      {recent.length === 0 ? (
        <p className="scene-feed-card__empty">No scenes have been activated yet.</p>
      ) : (
        <ul className="scene-feed-card__list" aria-label="Recently activated scenes">
          {recent.map((entity) => {
            const name   = sceneName(entity);
            const areaId = entityAreaMap[entity.entity_id] ?? null;
            const room   = areaId ? (areaMap[areaId]?.name ?? null) : null;

            return (
              <li key={entity.entity_id} className="scene-feed-row">
                <span className="scene-feed-row__icon" aria-hidden="true">
                  <Sparkles size={14} strokeWidth={1.75} />
                </span>
                <div className="scene-feed-row__info">
                  <span className="scene-feed-row__name">{name}</span>
                  {room && <span className="scene-feed-row__room">{room}</span>}
                </div>
                <span
                  className="scene-feed-row__time"
                  aria-label={`activated ${formatRelativeTime(entity.state)}`}
                >
                  {formatRelativeTime(entity.state)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
