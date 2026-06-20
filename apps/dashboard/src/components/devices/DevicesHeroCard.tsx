/**
 * DevicesHeroCard — full-width summary hero for the Devices page.
 * Shows integration / device / entity / room counts and the Home Status state.
 */

import React from 'react';
import {
  Boxes, Cpu, LayoutGrid, DoorOpen,
  CheckCircle2, AlertTriangle, AlertCircle, Monitor,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useSystemHealth } from '../../ha/useSystemHealth';
import type { DevicesSummary } from '@hapulse/core';

interface StatProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

function Stat({ icon, value, label }: StatProps) {
  return (
    <div className="devices-hero__stat">
      <span className="devices-hero__stat-icon" aria-hidden="true">{icon}</span>
      <div className="devices-hero__stat-body">
        <span className="devices-hero__stat-value data-font">{value}</span>
        <span className="devices-hero__stat-label">{label}</span>
      </div>
    </div>
  );
}

export function DevicesHeroCard({ summary }: { summary: DevicesSummary }) {
  const { health, title } = useSystemHealth();
  const StatusIcon =
    health === 'healthy' ? CheckCircle2 :
    health === 'warning' ? AlertTriangle :
    health === 'critical' ? AlertCircle : Monitor;

  return (
    <Card className="devices-hero">
      <div className="devices-hero__head">
        <div>
          <h2 className="devices-hero__title">All Devices</h2>
          <p className="devices-hero__subtitle">
            {summary.devices} devices · {summary.rooms} {summary.rooms === 1 ? 'room' : 'rooms'}
          </p>
        </div>
        <span className={`devices-hero__status devices-hero__status--${health}`}>
          <StatusIcon size={15} strokeWidth={2} />
          {title}
        </span>
      </div>

      <div className="devices-hero__stats">
        <Stat icon={<Boxes size={18} strokeWidth={1.75} />} value={summary.integrations} label="Integrations" />
        <Stat icon={<Cpu size={18} strokeWidth={1.75} />} value={summary.devices} label="Devices" />
        <Stat icon={<LayoutGrid size={18} strokeWidth={1.75} />} value={summary.entities} label="Entities" />
        <Stat icon={<DoorOpen size={18} strokeWidth={1.75} />} value={summary.rooms} label="Rooms" />
      </div>
    </Card>
  );
}
