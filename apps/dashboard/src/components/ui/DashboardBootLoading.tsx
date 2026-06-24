import { PulseLogo } from './PulseLogo';
import './DashboardBootLoading.css';

/**
 * Full-screen branded loading state shown while the dashboard resumes a
 * persisted connection on boot (OAuth/token), so the brief "not yet connected"
 * window never flashes the login screen or an empty shell. Visually matches the
 * web host's DashboardLoading (shown during bundle load) for a seamless handoff.
 */
export function DashboardBootLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="dash-boot" role="status" aria-live="polite">
      <div className="dash-boot__mark">
        <PulseLogo size={40} />
        <div className="dash-boot__spinner" aria-hidden="true" />
      </div>
      <p className="dash-boot__label">{label}</p>
    </div>
  );
}
