/**
 * DevicesToolbar — search, room + integration filters, and list/grid toggle.
 */

import React from 'react';
import { Search, List, LayoutGrid, ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

interface DevicesToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  rooms: FilterOption[];
  room: string;
  onRoomChange: (v: string) => void;
  integrations: FilterOption[];
  integration: string;
  onIntegrationChange: (v: string) => void;
  view: 'grid' | 'list';
  onViewChange: (v: 'grid' | 'list') => void;
}

function Select({
  value, onChange, options, ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  ariaLabel: string;
}) {
  return (
    <div className="devices-select">
      <select
        className="devices-select__native"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} strokeWidth={2} className="devices-select__chevron" aria-hidden="true" />
    </div>
  );
}

export function DevicesToolbar({
  search, onSearchChange,
  rooms, room, onRoomChange,
  integrations, integration, onIntegrationChange,
  view, onViewChange,
}: DevicesToolbarProps) {
  return (
    <div className="devices-toolbar">
      <div className="devices-toolbar__search">
        <Search size={16} strokeWidth={2} aria-hidden="true" />
        <input
          type="search"
          className="devices-toolbar__search-input"
          placeholder="Search devices…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search devices"
        />
      </div>

      <div className="devices-toolbar__filters">
        <Select
          ariaLabel="Filter by room"
          value={room}
          onChange={onRoomChange}
          options={[{ value: '', label: 'All rooms' }, ...rooms]}
        />
        <Select
          ariaLabel="Filter by integration"
          value={integration}
          onChange={onIntegrationChange}
          options={[{ value: '', label: 'All integrations' }, ...integrations]}
        />

        <div className="devices-view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={`devices-view-toggle__btn${view === 'list' ? ' devices-view-toggle__btn--active' : ''}`}
            onClick={() => onViewChange('list')}
            aria-label="List view"
            aria-pressed={view === 'list'}
          >
            <List size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`devices-view-toggle__btn${view === 'grid' ? ' devices-view-toggle__btn--active' : ''}`}
            onClick={() => onViewChange('grid')}
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
          >
            <LayoutGrid size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
