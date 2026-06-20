import React from 'react';
import { Workflow, CheckCircle, XCircle, Tag } from 'lucide-react';
import { Card } from '../ui/Card';
import type { HassEntity } from '@hapulse/core';
import './AutomationHeroCard.css';

interface AutomationHeroCardProps {
  automations: HassEntity[];
  categories: string[];
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return 'Never';
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

export function AutomationHeroCard({ automations, categories }: AutomationHeroCardProps) {
  const total    = automations.length;
  const active   = automations.filter((e) => e.state === 'on').length;
  const disabled = total - active;

  const lastRan = automations
    .filter((e) => e.attributes.last_triggered != null)
    .sort((a, b) => {
      const at = new Date(a.attributes.last_triggered as string).getTime();
      const bt = new Date(b.attributes.last_triggered as string).getTime();
      return bt - at;
    })[0];

  const lastRanName = lastRan
    ? ((lastRan.attributes.friendly_name as string | undefined) ??
       lastRan.entity_id.split('.')[1]!.replace(/_/g, ' '))
    : null;

  const lastRanTime = lastRan?.attributes.last_triggered as string | null | undefined;

  return (
    <Card className="auto-hero-card">
      <div className="auto-hero-card__bg" aria-hidden="true" />

      <div className="auto-hero-card__content">
        <div className="auto-hero-card__top">
          <div>
            <div className="auto-hero-card__eyebrow-row">
              <span className="auto-hero-card__icon-chip" aria-hidden="true">
                <Workflow size={16} strokeWidth={1.75} />
              </span>
              <span className="auto-hero-card__eyebrow">Automations</span>
            </div>
            <div className="auto-hero-card__total" aria-label={`${total} total automations`}>
              {total}
            </div>
            <div className="auto-hero-card__sub">total automations</div>
          </div>

          {lastRanName && (
            <div className="auto-hero-card__last-ran" aria-label={`Last ran: ${lastRanName}`}>
              <div className="auto-hero-card__last-ran-label">Last ran</div>
              <div className="auto-hero-card__last-ran-name">{lastRanName}</div>
              {lastRanTime && (
                <div className="auto-hero-card__last-ran-time">
                  {formatRelativeTime(lastRanTime)}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="auto-hero-card__stats" role="list" aria-label="Automation statistics">
          <div className="auto-hero-card__stat auto-hero-card__stat--active" role="listitem">
            <CheckCircle size={14} strokeWidth={2} aria-hidden="true" />
            <span className="auto-hero-card__stat-value">{active}</span>
            <span className="auto-hero-card__stat-label">active</span>
          </div>
          <div className="auto-hero-card__stat-divider" aria-hidden="true" />
          <div className="auto-hero-card__stat auto-hero-card__stat--disabled" role="listitem">
            <XCircle size={14} strokeWidth={2} aria-hidden="true" />
            <span className="auto-hero-card__stat-value">{disabled}</span>
            <span className="auto-hero-card__stat-label">disabled</span>
          </div>
          <div className="auto-hero-card__stat-divider" aria-hidden="true" />
          <div className="auto-hero-card__stat auto-hero-card__stat--cats" role="listitem">
            <Tag size={14} strokeWidth={2} aria-hidden="true" />
            <span className="auto-hero-card__stat-value">{categories.length}</span>
            <span className="auto-hero-card__stat-label">
              {categories.length === 1 ? 'category' : 'categories'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
