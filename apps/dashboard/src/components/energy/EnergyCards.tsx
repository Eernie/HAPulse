/**
 * Energy dashboard cards — hero, sources chart, devices, solar, water, gas,
 * and the "not configured" prompt. All driven by the computed EnergyDashboard.
 */

import React from 'react';
import {
  Zap,
  Sun,
  Plug,
  Flame,
  Droplets,
  BatteryCharging,
  ArrowDownToLine,
  ArrowUpFromLine,
  House,
  ExternalLink,
} from 'lucide-react';
import { Card } from '../ui/Card';
import type { EnergyDashboard, EnergyPeriod } from '@hapulse/core';
import './EnergyCards.css';

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', JPY: '¥', CHF: 'CHF', SEK: 'kr', NOK: 'kr',
  DKK: 'kr', PLN: 'zł', AUD: 'A$', CAD: 'C$',
};

export function fmtEnergy(n: number): string {
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return n.toFixed(digits);
}

export function fmtCost(n: number, currency: string | null): string {
  const sym = currency ? (CURRENCY_SYMBOL[currency] ?? `${currency} `) : '';
  return `${sym}${n.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Period selector (lives in the hero header)
// ---------------------------------------------------------------------------

const PERIODS: { id: EnergyPeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

function PeriodSelector({
  period,
  onChange,
}: {
  period: EnergyPeriod;
  onChange: (p: EnergyPeriod) => void;
}) {
  return (
    <div className="energy-period" role="tablist" aria-label="Time period">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={period === p.id}
          className={`energy-period__btn${period === p.id ? ' energy-period__btn--active' : ''}`}
          onClick={() => onChange(p.id)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero card
// ---------------------------------------------------------------------------

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  tone?: 'accent' | 'info' | 'positive' | 'danger' | 'neutral';
}

function StatTile({ icon, label, value, unit, tone = 'neutral' }: StatTileProps) {
  return (
    <div className={`energy-stat energy-stat--${tone}`}>
      <span className="energy-stat__icon" aria-hidden="true">{icon}</span>
      <div className="energy-stat__body">
        <span className="energy-stat__label">{label}</span>
        <span className="energy-stat__value data-font">
          {value}
          {unit && <span className="energy-stat__unit"> {unit}</span>}
        </span>
      </div>
    </div>
  );
}

export function EnergyHeroCard({
  dashboard,
  period,
  onPeriodChange,
  currency,
}: {
  dashboard: EnergyDashboard;
  period: EnergyPeriod;
  onPeriodChange: (p: EnergyPeriod) => void;
  currency: string | null;
}) {
  return (
    <Card className="energy-hero">
      <div className="energy-hero__header">
        <div className="energy-card__title-row">
          <span className="energy-card__icon-chip" aria-hidden="true">
            <Zap size={16} strokeWidth={1.75} />
          </span>
          <span className="energy-card__title">Energy</span>
        </div>
        <PeriodSelector period={period} onChange={onPeriodChange} />
      </div>

      <div className="energy-hero__primary">
        <span className="energy-hero__primary-label">
          <House size={14} strokeWidth={2} /> Home consumption
        </span>
        <span className="energy-hero__primary-value data-font">
          {fmtEnergy(dashboard.homeConsumption)}
          <span className="energy-hero__primary-unit"> kWh</span>
        </span>
      </div>

      <div className="energy-hero__stats">
        {dashboard.hasGrid && (
          <StatTile
            icon={<ArrowDownToLine size={16} strokeWidth={1.75} />}
            label="From grid"
            value={fmtEnergy(dashboard.gridConsumed)}
            unit="kWh"
            tone="info"
          />
        )}
        {dashboard.hasGrid && (
          <StatTile
            icon={<ArrowUpFromLine size={16} strokeWidth={1.75} />}
            label="Returned"
            value={fmtEnergy(dashboard.gridReturned)}
            unit="kWh"
            tone="positive"
          />
        )}
        {dashboard.hasSolar && (
          <StatTile
            icon={<Sun size={16} strokeWidth={1.75} />}
            label="Solar"
            value={fmtEnergy(dashboard.solarProduced)}
            unit="kWh"
            tone="accent"
          />
        )}
        {dashboard.hasBattery && (
          <StatTile
            icon={<BatteryCharging size={16} strokeWidth={1.75} />}
            label="Battery out"
            value={fmtEnergy(dashboard.batteryOut)}
            unit="kWh"
            tone="neutral"
          />
        )}
        {dashboard.cost != null && (
          <StatTile
            icon={<Zap size={16} strokeWidth={1.75} />}
            label="Grid cost"
            value={fmtCost(dashboard.cost, currency)}
            tone="danger"
          />
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sources chart card
// ---------------------------------------------------------------------------

export function EnergySourcesCard({ dashboard }: { dashboard: EnergyDashboard }) {
  const { series } = dashboard;
  const max = Math.max(
    0.001,
    ...series.map((p) => p.gridConsumed + p.solar)
  );

  return (
    <Card className="energy-sources">
      <div className="energy-card__header">
        <div className="energy-card__title-row">
          <span className="energy-card__icon-chip" aria-hidden="true">
            <Zap size={16} strokeWidth={1.75} />
          </span>
          <span className="energy-card__title">Sources</span>
        </div>
        <div className="energy-legend">
          {dashboard.hasGrid && (
            <span className="energy-legend__item">
              <span className="energy-legend__swatch energy-legend__swatch--grid" />
              Grid
            </span>
          )}
          {dashboard.hasSolar && (
            <span className="energy-legend__item">
              <span className="energy-legend__swatch energy-legend__swatch--solar" />
              Solar
            </span>
          )}
        </div>
      </div>

      {series.length === 0 ? (
        <p className="energy-empty">No data for this period yet.</p>
      ) : (
        <div className="energy-chart" role="img" aria-label="Energy sources over time">
          {series.map((p) => (
            <div key={p.start} className="energy-chart__col">
              <div className="energy-chart__stack">
                <div
                  className="energy-chart__seg energy-chart__seg--solar"
                  style={{ height: `${(p.solar / max) * 100}%` }}
                />
                <div
                  className="energy-chart__seg energy-chart__seg--grid"
                  style={{ height: `${(p.gridConsumed / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="energy-sources__totals">
        {dashboard.hasGrid && (
          <div className="energy-total">
            <span className="energy-total__dot energy-total__dot--grid" />
            <span className="energy-total__label">From grid</span>
            <span className="energy-total__value data-font">{fmtEnergy(dashboard.gridConsumed)} kWh</span>
          </div>
        )}
        {dashboard.hasSolar && (
          <div className="energy-total">
            <span className="energy-total__dot energy-total__dot--solar" />
            <span className="energy-total__label">Solar produced</span>
            <span className="energy-total__value data-font">{fmtEnergy(dashboard.solarProduced)} kWh</span>
          </div>
        )}
        {dashboard.hasGrid && (
          <div className="energy-total">
            <span className="energy-total__dot energy-total__dot--return" />
            <span className="energy-total__label">Returned to grid</span>
            <span className="energy-total__value data-font">{fmtEnergy(dashboard.gridReturned)} kWh</span>
          </div>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Devices card
// ---------------------------------------------------------------------------

export function EnergyDevicesCard({ dashboard }: { dashboard: EnergyDashboard }) {
  const max = Math.max(0.001, ...dashboard.devices.map((d) => d.consumed));

  return (
    <Card className="energy-devices">
      <div className="energy-card__header">
        <div className="energy-card__title-row">
          <span className="energy-card__icon-chip" aria-hidden="true">
            <Plug size={16} strokeWidth={1.75} />
          </span>
          <span className="energy-card__title">Devices</span>
        </div>
        <span className="energy-card__sub data-font">{fmtEnergy(dashboard.devicesTotal)} kWh</span>
      </div>

      {dashboard.devices.length === 0 ? (
        <p className="energy-empty">No individual devices configured.</p>
      ) : (
        <ul className="energy-devices__list">
          {dashboard.devices.map((d) => (
            <li key={d.id} className="energy-device">
              <span className="energy-device__name">{d.name}</span>
              <span className="energy-device__bar-wrap" aria-hidden="true">
                <span
                  className="energy-device__bar"
                  style={{ width: `${(d.consumed / max) * 100}%` }}
                />
              </span>
              <span className="energy-device__value data-font">{fmtEnergy(d.consumed)} kWh</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Solar card
// ---------------------------------------------------------------------------

export function EnergySolarCard({ dashboard }: { dashboard: EnergyDashboard }) {
  const produced = dashboard.solarProduced;
  const selfPct = produced > 0 ? Math.round((dashboard.solarSelfConsumed / produced) * 100) : 0;

  return (
    <Card className="energy-solar">
      <div className="energy-card__header">
        <div className="energy-card__title-row">
          <span className="energy-card__icon-chip energy-card__icon-chip--accent" aria-hidden="true">
            <Sun size={16} strokeWidth={1.75} />
          </span>
          <span className="energy-card__title">Solar</span>
        </div>
        <span className="energy-card__sub data-font">{fmtEnergy(produced)} kWh</span>
      </div>

      <div className="energy-solar__rows">
        <div className="energy-kv">
          <span className="energy-kv__label">Self-consumed</span>
          <span className="energy-kv__value data-font">{fmtEnergy(dashboard.solarSelfConsumed)} kWh</span>
        </div>
        <div className="energy-kv">
          <span className="energy-kv__label">Returned to grid</span>
          <span className="energy-kv__value data-font">{fmtEnergy(dashboard.gridReturned)} kWh</span>
        </div>
      </div>

      <div className="energy-solar__meter" aria-hidden="true">
        <div className="energy-solar__meter-fill" style={{ width: `${selfPct}%` }} />
      </div>
      <span className="energy-solar__meter-label">{selfPct}% self-consumed</span>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Water card
// ---------------------------------------------------------------------------

export function EnergyWaterCard({ dashboard }: { dashboard: EnergyDashboard }) {
  return (
    <Card className="energy-water">
      <div className="energy-card__header">
        <div className="energy-card__title-row">
          <span className="energy-card__icon-chip energy-card__icon-chip--info" aria-hidden="true">
            <Droplets size={16} strokeWidth={1.75} />
          </span>
          <span className="energy-card__title">Water</span>
        </div>
        <span className="energy-card__sub data-font">
          {fmtEnergy(dashboard.waterConsumed)} {dashboard.waterUnit}
        </span>
      </div>

      {dashboard.water.length > 1 && (
        <ul className="energy-kv-list">
          {dashboard.water.map((w) => (
            <li key={w.id} className="energy-kv">
              <span className="energy-kv__label">{w.id.split('.')[1]?.replace(/_/g, ' ') ?? w.id}</span>
              <span className="energy-kv__value data-font">{fmtEnergy(w.consumed)} {dashboard.waterUnit}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Gas card
// ---------------------------------------------------------------------------

export function EnergyGasCard({ dashboard }: { dashboard: EnergyDashboard }) {
  return (
    <Card className="energy-gas">
      <div className="energy-card__header">
        <div className="energy-card__title-row">
          <span className="energy-card__icon-chip energy-card__icon-chip--danger" aria-hidden="true">
            <Flame size={16} strokeWidth={1.75} />
          </span>
          <span className="energy-card__title">Gas</span>
        </div>
        <span className="energy-card__sub data-font">
          {fmtEnergy(dashboard.gasConsumed)} {dashboard.gasUnit}
        </span>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Not-configured prompt
// ---------------------------------------------------------------------------

export function EnergyNotConfigured({ haUrl }: { haUrl: string }) {
  const setupUrl = haUrl ? `${haUrl.replace(/\/+$/, '')}/config/energy` : null;
  return (
    <Card className="energy-empty-state">
      <span className="energy-empty-state__icon" aria-hidden="true">
        <Zap size={32} strokeWidth={1.5} />
      </span>
      <h2 className="energy-empty-state__title">Energy isn’t set up yet</h2>
      <p className="energy-empty-state__desc">
        HAPulse reads your Home Assistant Energy dashboard configuration. Set up your grid,
        solar, battery and devices in Home Assistant, and they’ll appear here automatically.
      </p>
      {setupUrl && (
        <a
          className="energy-empty-state__btn"
          href={setupUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          Open Energy settings in Home Assistant
          <ExternalLink size={15} strokeWidth={2} />
        </a>
      )}
    </Card>
  );
}
