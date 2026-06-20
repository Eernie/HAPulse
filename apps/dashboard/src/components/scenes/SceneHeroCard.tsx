import React from 'react';
import { Sparkles, LayoutGrid } from 'lucide-react';
import { Card } from '../ui/Card';
import type { HassEntity } from '@hapulse/core';
import './SceneHeroCard.css';

interface SceneHeroCardProps {
  scenes: HassEntity[];
  roomCount: number;
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

export function SceneHeroCard({ scenes, roomCount }: SceneHeroCardProps) {
  const total = scenes.length;

  const activated = scenes.filter((e) => e.state !== 'unknown');
  const activatedToday = activated.filter((e) => {
    try {
      const d = new Date(e.state);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    } catch {
      return false;
    }
  });

  const lastUsed = activated.sort((a, b) => {
    try {
      return new Date(b.state).getTime() - new Date(a.state).getTime();
    } catch {
      return 0;
    }
  })[0];

  const lastUsedName = lastUsed ? sceneName(lastUsed) : null;
  const lastUsedTime = lastUsed?.state;

  return (
    <Card className="scene-hero-card">
      <div className="scene-hero-card__bg" aria-hidden="true" />

      <div className="scene-hero-card__content">
        <div className="scene-hero-card__top">
          <div>
            <div className="scene-hero-card__eyebrow-row">
              <span className="scene-hero-card__icon-chip" aria-hidden="true">
                <Sparkles size={16} strokeWidth={1.75} />
              </span>
              <span className="scene-hero-card__eyebrow">Scenes</span>
            </div>
            <div className="scene-hero-card__total" aria-label={`${total} total scenes`}>
              {total}
            </div>
            <div className="scene-hero-card__sub">total scenes</div>
          </div>

          {lastUsedName && (
            <div className="scene-hero-card__last-used" aria-label={`Last used: ${lastUsedName}`}>
              <div className="scene-hero-card__last-used-label">Last used</div>
              <div className="scene-hero-card__last-used-name">{lastUsedName}</div>
              {lastUsedTime && (
                <div className="scene-hero-card__last-used-time">
                  {formatRelativeTime(lastUsedTime)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="scene-hero-card__stats" role="list" aria-label="Scene statistics">
          <div className="scene-hero-card__stat scene-hero-card__stat--activated" role="listitem">
            <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
            <span className="scene-hero-card__stat-value">{activatedToday.length}</span>
            <span className="scene-hero-card__stat-label">used today</span>
          </div>
          <div className="scene-hero-card__stat-divider" aria-hidden="true" />
          <div className="scene-hero-card__stat scene-hero-card__stat--rooms" role="listitem">
            <LayoutGrid size={14} strokeWidth={2} aria-hidden="true" />
            <span className="scene-hero-card__stat-value">{roomCount}</span>
            <span className="scene-hero-card__stat-label">
              {roomCount === 1 ? 'room' : 'rooms'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
