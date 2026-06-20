/**
 * Device presentation helpers — icon per domain and friendly integration names.
 */

import React from 'react';
import {
  Lightbulb, Plug, Fan, Thermometer, Blinds, Lock, Speaker, Video,
  Gauge, ShieldCheck, Sparkles, User, CloudSun, Sun, CircleDot, Cpu,
} from 'lucide-react';

const DOMAIN_ICON: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  light: Lightbulb,
  switch: Plug,
  fan: Fan,
  climate: Thermometer,
  cover: Blinds,
  lock: Lock,
  media_player: Speaker,
  camera: Video,
  sensor: Gauge,
  binary_sensor: Gauge,
  alarm_control_panel: ShieldCheck,
  scene: Sparkles,
  person: User,
  weather: CloudSun,
  sun: Sun,
  button: CircleDot,
};

export function DeviceIcon({
  domain,
  size = 18,
  strokeWidth = 1.75,
}: {
  domain: string | null;
  size?: number;
  strokeWidth?: number;
}) {
  const Icon = (domain && DOMAIN_ICON[domain]) || Cpu;
  return <Icon size={size} strokeWidth={strokeWidth} />;
}

const INTEGRATION_LABELS: Record<string, string> = {
  hue: 'Philips Hue',
  tplink: 'TP-Link',
  nest: 'Google Nest',
  zwave_js: 'Z-Wave',
  zha: 'Zigbee',
  cast: 'Google Cast',
  generic: 'Generic Camera',
  manual_alarm: 'Manual Alarm',
  roborock: 'Roborock',
  systemmonitor: 'System Monitor',
  homeassistant: 'Home Assistant',
  person: 'Person',
  met: 'Met.no Weather',
  sun: 'Sun',
  mqtt: 'MQTT',
  spotify: 'Spotify',
};

/** Friendly display name for an integration / platform slug. */
export function integrationLabel(platform: string | null | undefined): string {
  if (!platform) return 'Unknown';
  return (
    INTEGRATION_LABELS[platform] ??
    platform.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
