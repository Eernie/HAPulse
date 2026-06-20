import React, { useCallback } from 'react';
import { Workflow } from 'lucide-react';
import { Card } from '../ui/Card';
import { callService } from '../../ha/service';
import type { HassEntity } from '@hapulse/core';
import './AutomationCategoryCard.css';

interface AutomationCategoryCardProps {
  category: string;
  automations: HassEntity[];
}

function entityName(e: HassEntity): string {
  return (
    (e.attributes.friendly_name as string | undefined) ??
    e.entity_id.split('.')[1]!.replace(/_/g, ' ')
  );
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

function sortAutomations(automations: HassEntity[]): HassEntity[] {
  return [...automations].sort((a, b) => {
    const at = a.attributes.last_triggered as string | null | undefined;
    const bt = b.attributes.last_triggered as string | null | undefined;
    if (at && bt) return new Date(bt).getTime() - new Date(at).getTime();
    if (at) return -1;
    if (bt) return 1;
    return entityName(a).localeCompare(entityName(b));
  });
}

interface AutomationRowProps {
  entity: HassEntity;
}

function AutomationRow({ entity }: AutomationRowProps) {
  const entityId      = entity.entity_id;
  const isOn          = entity.state === 'on';
  const name          = entityName(entity);
  const lastTriggered = entity.attributes.last_triggered as string | null | undefined;

  const handleToggle = useCallback(() => {
    void callService(
      'automation',
      isOn ? 'turn_off' : 'turn_on',
      {},
      { entity_id: entityId }
    );
  }, [entityId, isOn]);

  return (
    <li className={`auto-cat-row${!isOn ? ' auto-cat-row--disabled' : ''}`}>
      <span
        className={`auto-cat-row__icon${isOn ? ' auto-cat-row__icon--on' : ''}`}
        aria-hidden="true"
      >
        <Workflow size={13} strokeWidth={1.75} />
      </span>
      <div className="auto-cat-row__info">
        <span className="auto-cat-row__name">{name}</span>
        <span className="auto-cat-row__time">{formatRelativeTime(lastTriggered)}</span>
      </div>
      <label
        className="auto-row-toggle"
        aria-label={`${name}: ${isOn ? 'enabled' : 'disabled'}`}
      >
        <input type="checkbox" checked={isOn} onChange={handleToggle} />
        <span className="auto-row-toggle__track" aria-hidden="true">
          <span className="auto-row-toggle__knob" />
        </span>
      </label>
    </li>
  );
}

export function AutomationCategoryCard({ category, automations }: AutomationCategoryCardProps) {
  const sorted      = sortAutomations(automations);
  const activeCount = automations.filter((e) => e.state === 'on').length;

  return (
    <Card className="auto-cat-card">
      <div className="auto-cat-card__header">
        <div className="auto-cat-card__title-row">
          <span className="auto-cat-card__icon-chip" aria-hidden="true">
            <Workflow size={14} strokeWidth={1.75} />
          </span>
          <span className="auto-cat-card__title">{category}</span>
        </div>
        <span
          className="auto-cat-card__count"
          aria-label={`${activeCount} of ${automations.length} active`}
        >
          {activeCount}/{automations.length}
        </span>
      </div>

      <ul className="auto-cat-card__list" aria-label={`${category} automations`}>
        {sorted.map((entity) => (
          <AutomationRow key={entity.entity_id} entity={entity} />
        ))}
      </ul>
    </Card>
  );
}
