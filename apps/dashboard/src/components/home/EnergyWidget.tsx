/**
 * EnergyWidget — home overview card summarising today's energy.
 *
 * Uses the same data source as the Energy page (HA energy prefs + statistics
 * via useEnergy). When energy isn't configured in Home Assistant, it prompts the
 * user to set it up. Energy is NOT entity data — it comes from long-term
 * statistics, so this no longer scans the entity map for a "kWh sensor".
 */
import React from 'react';
import { Zap, ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Card } from '../ui/Card';
import { useEnergy } from '../../ha/useEnergy';
import { useConnectionStore } from '../../stores/connectionStore';
import { fmtEnergy } from '../energy/EnergyCards';
import './EnergyWidget.css';

export function EnergyWidget() {
  const navigate = useNavigate();
  const haUrl = useConnectionStore((s) => s.url);
  const { state, dashboard } = useEnergy('today');

  // While loading, render nothing to avoid a layout flash.
  if (state === 'loading') return null;

  // ---- Not configured: prompt the user to set it up in HA ----
  if (state === 'not-configured') {
    const setupUrl = haUrl ? `${haUrl.replace(/\/+$/, '')}/config/energy` : null;
    return (
      <Card className="energy-widget energy-widget--prompt">
        <div className="energy-widget__header">
          <div className="energy-widget__title-row">
            <span className="energy-widget__icon-chip" aria-hidden="true">
              <Zap size={16} strokeWidth={1.75} />
            </span>
            <span className="energy-widget__title">Energy</span>
          </div>
        </div>
        <p className="energy-widget__prompt-text">
          Set up the Energy dashboard in Home Assistant to see your usage here.
        </p>
        {setupUrl && (
          <a
            className="energy-widget__prompt-btn"
            href={setupUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            Set up in Home Assistant
            <ExternalLink size={14} strokeWidth={2} />
          </a>
        )}
      </Card>
    );
  }

  if (state === 'error' || !dashboard) return null;

  const series = dashboard.series;
  const bars = series.map((p) => p.gridConsumed + p.solar);
  const maxBar = Math.max(...bars, 0.01);

  return (
    <Card className="energy-widget">
      <div className="energy-widget__header">
        <div className="energy-widget__title-row">
          <span className="energy-widget__icon-chip" aria-hidden="true">
            <Zap size={16} strokeWidth={1.75} />
          </span>
          <span className="energy-widget__title">Energy Today</span>
        </div>
        <button
          className="energy-widget__link"
          onClick={() => void navigate('/energy')}
          type="button"
          aria-label="View energy details"
        >
          Details
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>

      <div className="card-scroll-body card-scroll-wrap">
      <div className="energy-widget__value-row">
        <span className="energy-widget__value">{fmtEnergy(dashboard.homeConsumption)}</span>
        <span className="energy-widget__unit">kWh</span>
      </div>

      {bars.length > 0 && (
        <div className="energy-widget__chart" role="img" aria-label="Energy usage chart">
          {bars.map((h, i) => (
            <div
              key={i}
              className="energy-widget__bar"
              style={{ height: `${(h / maxBar) * 100}%` }}
            />
          ))}
        </div>
      )}
      </div>
    </Card>
  );
}
