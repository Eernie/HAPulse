/**
 * useSystemHealth — derives the overall "Home Status" shown in the sidebar pill,
 * the System hero and the Devices hero. Single source of truth so they agree.
 *
 * Health from System Monitor CPU/RAM/disk thresholds, plus low batteries and
 * unavailable entities (respecting hiddenEntities).
 */

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEntityStore } from '../stores/entityStore';
import { useSettingsStore } from '../stores/settingsStore';

export type SystemHealth = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface SystemHealthInfo {
  health: SystemHealth;
  title: string;
}

export function useSystemHealth(): SystemHealthInfo {
  const { entities, registries } = useEntityStore(
    useShallow((s) => ({ entities: s.entities, registries: s.registries })),
  );
  const hiddenEntities = useSettingsStore(useShallow((s) => s.customization.hiddenEntities));

  return useMemo(() => {
    const sysIds = new Set<string>();
    for (const re of registries?.entities ?? []) {
      if (re.platform === 'systemmonitor') sysIds.add(re.entity_id);
    }

    const all = Object.values(entities);
    const sys = all.filter((e) => sysIds.has(e.entity_id));

    const cpu = sys.find((e) => /processor_use/.test(e.entity_id) && !/nice/.test(e.entity_id));
    const mem = sys.find((e) => /memory_use_percent/.test(e.entity_id));
    const disk = sys.find((e) => /disk_use_percent/.test(e.entity_id));

    const cpuVal = cpu ? parseFloat(cpu.state) : NaN;
    const memVal = mem ? parseFloat(mem.state) : NaN;
    const diskVal = disk ? parseFloat(disk.state) : NaN;
    const hasMetrics = !isNaN(cpuVal) || !isNaN(memVal) || !isNaN(diskVal);

    const metricsCrit =
      (!isNaN(cpuVal) && cpuVal > 90) ||
      (!isNaN(memVal) && memVal > 90) ||
      (!isNaN(diskVal) && diskVal > 90);
    const metricsWarn =
      (!isNaN(cpuVal) && cpuVal > 75) ||
      (!isNaN(memVal) && memVal > 80) ||
      (!isNaN(diskVal) && diskVal > 80);

    const hidden = new Set(hiddenEntities);
    const lowBatteries = all.filter(
      (e) =>
        e.entity_id.startsWith('sensor.') &&
        (e.attributes.device_class as string | undefined) === 'battery' &&
        !hidden.has(e.entity_id) &&
        parseFloat(e.state) <= 20,
    ).length;
    const unavailable = all.filter(
      (e) => e.state === 'unavailable' && !hidden.has(e.entity_id),
    ).length;

    const health: SystemHealth =
      metricsCrit ? 'critical' :
      metricsWarn || unavailable > 0 || lowBatteries > 0 ? 'warning' :
      hasMetrics ? 'healthy' : 'unknown';

    const title =
      metricsCrit ? 'System critical' :
      metricsWarn ? 'System under load' :
      unavailable > 0 ? `${unavailable} unavailable` :
      lowBatteries > 0 ? `${lowBatteries} low ${lowBatteries === 1 ? 'battery' : 'batteries'}` :
      hasMetrics ? 'All systems normal' : 'System status unknown';

    return { health, title };
  }, [entities, registries, hiddenEntities]);
}
