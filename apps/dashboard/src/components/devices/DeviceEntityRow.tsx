/**
 * DeviceEntityRow — compact, interactive list row for an entity in the device
 * details modal. Each domain gets an appropriate inline control:
 *  - light/switch/fan/lock/…  → switch
 *  - climate / number         → −/+ stepper
 *  - cover                    → open / stop / close
 *  - media_player             → prev / play-pause / next
 *  - vacuum                   → start-pause / dock
 *  - button / scene / script  → action button
 *  - select                   → dropdown
 *  - everything else          → formatted state value
 */

import React, { useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown,
  Square, House, Minus, Plus, Eye, EyeOff, Star,
} from 'lucide-react';
import { domainOf, formatEntityState } from '@hapulse/core';
import type { HassEntity } from '@hapulse/core';
import { callService } from '../../ha/service';
import { DeviceIcon } from './deviceMeta';

const TOGGLE_DOMAINS = new Set(['light', 'switch', 'fan', 'input_boolean', 'humidifier', 'siren']);

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function RowToggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`device-toggle${on ? ' device-toggle--on' : ''}`}
      onClick={onToggle}
    >
      <span className="device-toggle__knob" aria-hidden="true" />
    </button>
  );
}

function Stepper({
  value, unit, onStep,
}: {
  value: string;
  unit?: string;
  onStep: (dir: -1 | 1) => void;
}) {
  return (
    <div className="device-stepper">
      <button type="button" className="device-icon-btn" aria-label="Decrease" onClick={() => onStep(-1)}>
        <Minus size={15} strokeWidth={2.25} />
      </button>
      <span className="device-stepper__value data-font">{value}{unit}</span>
      <button type="button" className="device-icon-btn" aria-label="Increase" onClick={() => onStep(1)}>
        <Plus size={15} strokeWidth={2.25} />
      </button>
    </div>
  );
}

function Transport({ children }: { children: React.ReactNode }) {
  return <div className="device-transport">{children}</div>;
}

function IconBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" className="device-icon-btn" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

interface DeviceEntityRowProps {
  entity: HassEntity;
  name: string;
  /** When true (Settings editing enabled), show favorite + hide buttons. */
  editable?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isHidden?: boolean;
  onToggleHide?: () => void;
}

export function DeviceEntityRow({
  entity,
  name,
  editable = false,
  isFavorite = false,
  onToggleFavorite,
  isHidden = false,
  onToggleHide,
}: DeviceEntityRowProps) {
  const id = entity.entity_id;
  const domain = domainOf(id);
  const attrs = entity.attributes;
  const target = { entity_id: id };

  const call = useCallback(
    (d: string, service: string, data?: Record<string, unknown>) =>
      void callService(d, service, data ?? {}, target),
    [id],
  );

  let control: React.ReactNode = null;

  if (TOGGLE_DOMAINS.has(domain)) {
    control = <RowToggle on={entity.state === 'on'} onToggle={() => call(domain, 'toggle')} label={`Toggle ${name}`} />;
  } else if (domain === 'lock') {
    const locked = entity.state === 'locked';
    control = <RowToggle on={locked} onToggle={() => call('lock', locked ? 'unlock' : 'lock')} label={`${locked ? 'Unlock' : 'Lock'} ${name}`} />;
  } else if (domain === 'climate') {
    const tempTarget = attrs['temperature'];
    if (typeof tempTarget === 'number') {
      const step = num(attrs['target_temp_step'], 0.5);
      const min = num(attrs['min_temp'], 7);
      const max = num(attrs['max_temp'], 35);
      const onStep = (dir: -1 | 1) => {
        const next = Math.min(max, Math.max(min, tempTarget + dir * step));
        call('climate', 'set_temperature', { temperature: Math.round(next * 10) / 10 });
      };
      control = <Stepper value={String(tempTarget)} unit="°" onStep={onStep} />;
    }
  } else if (domain === 'number' || domain === 'input_number') {
    const val = num(entity.state, NaN);
    if (Number.isFinite(val)) {
      const step = num(attrs['step'], 1);
      const min = num(attrs['min'], -Infinity);
      const max = num(attrs['max'], Infinity);
      const unit = attrs['unit_of_measurement'] as string | undefined;
      const onStep = (dir: -1 | 1) => {
        const next = Math.min(max, Math.max(min, val + dir * step));
        call(domain, 'set_value', { value: Math.round(next * 1000) / 1000 });
      };
      control = <Stepper value={String(val)} {...(unit ? { unit: ` ${unit}` } : {})} onStep={onStep} />;
    }
  } else if (domain === 'cover') {
    control = (
      <Transport>
        <IconBtn label="Open" onClick={() => call('cover', 'open_cover')}><ChevronUp size={16} strokeWidth={2} /></IconBtn>
        <IconBtn label="Stop" onClick={() => call('cover', 'stop_cover')}><Square size={13} strokeWidth={2.5} /></IconBtn>
        <IconBtn label="Close" onClick={() => call('cover', 'close_cover')}><ChevronDown size={16} strokeWidth={2} /></IconBtn>
      </Transport>
    );
  } else if (domain === 'media_player') {
    const playing = entity.state === 'playing';
    control = (
      <Transport>
        <IconBtn label="Previous" onClick={() => call('media_player', 'media_previous_track')}><SkipBack size={15} strokeWidth={2} /></IconBtn>
        <IconBtn label={playing ? 'Pause' : 'Play'} onClick={() => call('media_player', playing ? 'media_pause' : 'media_play')}>
          {playing ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
        </IconBtn>
        <IconBtn label="Next" onClick={() => call('media_player', 'media_next_track')}><SkipForward size={15} strokeWidth={2} /></IconBtn>
      </Transport>
    );
  } else if (domain === 'vacuum') {
    const cleaning = entity.state === 'cleaning';
    control = (
      <Transport>
        <IconBtn label={cleaning ? 'Pause' : 'Start'} onClick={() => call('vacuum', cleaning ? 'pause' : 'start')}>
          {cleaning ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
        </IconBtn>
        <IconBtn label="Return to dock" onClick={() => call('vacuum', 'return_to_base')}><House size={15} strokeWidth={2} /></IconBtn>
      </Transport>
    );
  } else if (domain === 'select' || domain === 'input_select') {
    const options = (attrs['options'] as string[] | undefined) ?? [];
    control = (
      <div className="device-row-select">
        <select
          value={entity.state}
          aria-label={name}
          onChange={(e) => call(domain, 'select_option', { option: e.target.value })}
        >
          {!options.includes(entity.state) && <option value={entity.state}>{entity.state}</option>}
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} strokeWidth={2} className="device-row-select__chevron" aria-hidden="true" />
      </div>
    );
  } else if (domain === 'button' || domain === 'input_button') {
    control = <button type="button" className="device-row-action" onClick={() => call(domain, 'press')}>Press</button>;
  } else if (domain === 'scene') {
    control = <button type="button" className="device-row-action" onClick={() => call('scene', 'turn_on')}>Activate</button>;
  } else if (domain === 'script') {
    control = <button type="button" className="device-row-action" onClick={() => call('script', 'turn_on')}>Run</button>;
  }

  if (control === null) {
    control = <span className="device-entity-row__value" title={entity.state}>{formatEntityState(entity)}</span>;
  }

  return (
    <div className={`device-entity-row${editable && isHidden ? ' device-entity-row--hidden' : ''}`}>
      <span className="device-entity-row__icon" aria-hidden="true">
        <DeviceIcon domain={domain} size={16} />
      </span>
      <span className="device-entity-row__name" title={name}>{name}</span>
      <span className="device-entity-row__control">
        {control}
        {editable && (
          <span className="device-entity-row__edit">
            <button
              type="button"
              className={`device-icon-btn device-row-fav${isFavorite ? ' device-row-fav--on' : ''}`}
              aria-label={isFavorite ? `Unfavorite ${name}` : `Favorite ${name}`}
              aria-pressed={isFavorite}
              onClick={onToggleFavorite}
            >
              <Star size={15} strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="device-icon-btn"
              aria-label={isHidden ? `Show ${name}` : `Hide ${name}`}
              aria-pressed={isHidden}
              onClick={onToggleHide}
            >
              {isHidden ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
            </button>
          </span>
        )}
      </span>
    </div>
  );
}
