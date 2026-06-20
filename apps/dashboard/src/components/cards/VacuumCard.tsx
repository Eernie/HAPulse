import React, { useCallback } from 'react';
import { Bot, Play, Pause, Home, Battery } from 'lucide-react';
import { Card } from '../ui/Card';
import { callService } from '../../ha/service';
import type { HassEntity } from '@hapulse/core';
import './cards.css';

interface VacuumCardProps {
  entity: HassEntity;
  name: string;
}

const STATE_LABELS: Record<string, string> = {
  cleaning: 'Cleaning',
  docked: 'Docked',
  idle: 'Idle',
  paused: 'Paused',
  returning: 'Returning',
  error: 'Error',
  unknown: 'Unknown',
  unavailable: 'Unavailable',
};

export function VacuumCard({ entity, name }: VacuumCardProps) {
  const entityId = entity.entity_id;
  const state = entity.state;
  const batteryLevel = entity.attributes.battery_level as number | undefined;
  const status = entity.attributes.status as string | undefined;

  const isActive = state === 'cleaning';
  const isPaused = state === 'paused';
  const isDocked = state === 'docked';
  const isReturning = state === 'returning';

  const handleStart = useCallback(() => {
    void callService('vacuum', 'start', {}, { entity_id: entityId });
  }, [entityId]);

  const handlePause = useCallback(() => {
    void callService('vacuum', 'pause', {}, { entity_id: entityId });
  }, [entityId]);

  const handleReturn = useCallback(() => {
    void callService('vacuum', 'return_to_base', {}, { entity_id: entityId });
  }, [entityId]);

  const displayLabel = STATE_LABELS[state] ?? state;

  return (
    <Card active={isActive} className="vacuum-card">
      <div className="vacuum-card__header">
        <div className={`icon-chip vacuum-card__chip${isActive ? ' vacuum-card__chip--active' : isDocked ? ' vacuum-card__chip--docked' : ''}`}>
          <Bot size={20} strokeWidth={1.75} />
        </div>
        <div className="vacuum-card__info">
          <span className="vacuum-card__name">{name}</span>
          <span className={`vacuum-card__state vacuum-card__state--${state}`}>
            {status ?? displayLabel}
          </span>
        </div>
        {batteryLevel != null && (
          <div className="vacuum-card__battery">
            <Battery size={14} strokeWidth={1.75} />
            <span>{batteryLevel}%</span>
          </div>
        )}
      </div>

      <div className="vacuum-card__controls">
        {(isDocked || state === 'idle' || isPaused) && (
          <button type="button" className="vacuum-card__btn vacuum-card__btn--start" onClick={handleStart} aria-label="Start cleaning">
            <Play size={15} strokeWidth={2} />
            <span>{isPaused ? 'Resume' : 'Start'}</span>
          </button>
        )}
        {isActive && (
          <button type="button" className="vacuum-card__btn" onClick={handlePause} aria-label="Pause">
            <Pause size={15} strokeWidth={2} />
            <span>Pause</span>
          </button>
        )}
        {!isDocked && !isReturning && (
          <button type="button" className="vacuum-card__btn" onClick={handleReturn} aria-label="Return to dock">
            <Home size={15} strokeWidth={1.75} />
            <span>Dock</span>
          </button>
        )}
      </div>
    </Card>
  );
}
