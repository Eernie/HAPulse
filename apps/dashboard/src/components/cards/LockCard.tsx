import React, { useCallback } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Card } from '../ui/Card';
import { callService } from '../../ha/service';
import type { HassEntity } from '@hapulse/core';
import './cards.css';

interface LockCardProps {
  entity: HassEntity;
  name: string;
}

export function LockCard({ entity, name }: LockCardProps) {
  const entityId = entity.entity_id;
  const isLocked = entity.state === 'locked';

  const handleToggle = useCallback(() => {
    void callService('lock', isLocked ? 'unlock' : 'lock', {}, { entity_id: entityId });
  }, [isLocked, entityId]);

  return (
    <Card className="lock-card">
      {/* Icon chip — green when locked, amber when unlocked */}
      <div className={`icon-chip lock-card__chip lock-card__chip--${isLocked ? 'locked' : 'unlocked'}`}>
        {isLocked ? <Lock size={20} strokeWidth={1.75} /> : <Unlock size={20} strokeWidth={1.75} />}
      </div>

      <div className="lock-card__info">
        <div className="lock-card__name">{name}</div>
        <div className={`lock-card__state lock-card__state--${isLocked ? 'locked' : 'unlocked'}`}>
          {entity.state}
        </div>
      </div>

      <button
        type="button"
        className="lock-card__btn"
        onClick={handleToggle}
        aria-label={isLocked ? 'Unlock' : 'Lock'}
      >
        {isLocked ? 'Unlock' : 'Lock'}
      </button>
    </Card>
  );
}
