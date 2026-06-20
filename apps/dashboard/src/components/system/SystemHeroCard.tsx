import React from 'react';
import { Monitor, CheckCircle2, AlertTriangle, AlertCircle, Battery, WifiOff } from 'lucide-react';
import { Card } from '../ui/Card';
import type { HassEntity } from '@hapulse/core';
import './SystemHeroCard.css';

type SystemHealth = 'healthy' | 'warning' | 'critical' | 'unknown';

function deriveHealth(
  cpu: HassEntity | undefined,
  mem: HassEntity | undefined,
  disk: HassEntity | undefined,
): SystemHealth {
  const c = cpu ? parseFloat(cpu.state) : NaN;
  const m = mem ? parseFloat(mem.state) : NaN;
  const d = disk ? parseFloat(disk.state) : NaN;

  if (isNaN(c) && isNaN(m) && isNaN(d)) return 'unknown';

  if ((!isNaN(c) && c > 90) || (!isNaN(m) && m > 90) || (!isNaN(d) && d > 90)) return 'critical';
  if ((!isNaN(c) && c > 75) || (!isNaN(m) && m > 80) || (!isNaN(d) && d > 80)) return 'warning';
  return 'healthy';
}

function metricChipClass(val: number, warnAt: number, critAt: number): string {
  if (val > critAt) return 'system-hero-chip--critical';
  if (val > warnAt) return 'system-hero-chip--warn';
  return 'system-hero-chip--ok';
}

interface SystemHeroCardProps {
  systemMonitorEntities: HassEntity[];
  lowBatteryCount: number;
  unavailableCount: number;
}

export function SystemHeroCard({ systemMonitorEntities, lowBatteryCount, unavailableCount }: SystemHeroCardProps) {
  const cpu = systemMonitorEntities.find((e) =>
    /processor_use/.test(e.entity_id) && !/nice/.test(e.entity_id)
  );
  const mem = systemMonitorEntities.find((e) => /memory_use_percent/.test(e.entity_id));
  const disk = systemMonitorEntities.find((e) => /disk_use_percent/.test(e.entity_id));

  const health = deriveHealth(cpu, mem, disk);

  const cpuVal  = cpu  ? parseFloat(cpu.state)  : null;
  const memVal  = mem  ? parseFloat(mem.state)  : null;
  const diskVal = disk ? parseFloat(disk.state) : null;

  const HealthIcon =
    health === 'healthy'  ? CheckCircle2 :
    health === 'warning'  ? AlertTriangle :
    health === 'critical' ? AlertCircle  : Monitor;

  const statusLabel =
    health === 'healthy'  ? 'All systems healthy' :
    health === 'warning'  ? 'System under load'   :
    health === 'critical' ? 'System critical'      : 'System status unknown';

  const gradientClass = `system-hero-card--${health}`;

  const hasAlerts = lowBatteryCount > 0 || unavailableCount > 0;

  return (
    <Card className={`system-hero-card ${gradientClass}`}>
      <div className="system-hero-card__inner">
        <div className="system-hero-card__main">
          <div className="system-hero-card__icon">
            <HealthIcon size={36} strokeWidth={1.5} />
          </div>
          <div className="system-hero-card__text">
            <p className="system-hero-card__label">System</p>
            <p className="system-hero-card__status">{statusLabel}</p>
          </div>
        </div>

        <div className="system-hero-card__chips">
          {cpuVal !== null && (
            <div className={`system-hero-chip ${metricChipClass(cpuVal, 75, 90)}`}>
              <span className="system-hero-chip__key">CPU</span>
              <span className="system-hero-chip__val">{Math.round(cpuVal)}%</span>
            </div>
          )}
          {memVal !== null && (
            <div className={`system-hero-chip ${metricChipClass(memVal, 80, 90)}`}>
              <span className="system-hero-chip__key">RAM</span>
              <span className="system-hero-chip__val">{Math.round(memVal)}%</span>
            </div>
          )}
          {diskVal !== null && (
            <div className={`system-hero-chip ${metricChipClass(diskVal, 80, 90)}`}>
              <span className="system-hero-chip__key">Disk</span>
              <span className="system-hero-chip__val">{Math.round(diskVal)}%</span>
            </div>
          )}
          {lowBatteryCount > 0 && (
            <div className="system-hero-chip system-hero-chip--warn">
              <Battery size={12} strokeWidth={2} aria-hidden="true" />
              <span>{lowBatteryCount} low {lowBatteryCount === 1 ? 'battery' : 'batteries'}</span>
            </div>
          )}
          {unavailableCount > 0 && (
            <div className="system-hero-chip system-hero-chip--critical">
              <WifiOff size={12} strokeWidth={2} aria-hidden="true" />
              <span>{unavailableCount} unavailable</span>
            </div>
          )}
          {!hasAlerts && cpuVal === null && memVal === null && diskVal === null && (
            <div className="system-hero-chip system-hero-chip--muted">
              <span>No metrics available</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
