/**
 * @hapulse/core — Public API
 *
 * Pure TypeScript, zero React/DOM dependencies.
 * All Home Assistant interaction goes through this module.
 */

// Connection
export { connectToHA, startHASignIn, resumeHASession, HAConnection } from './connection.js';
export type { ConnectToHAOptions, HASignInOptions, HAResumeOptions } from './connection.js';

// Re-export AuthData so callers can type the saveTokens/loadTokens callbacks
export type { AuthData } from 'home-assistant-js-websocket';

// Errors
export { HAAuthError, HAConnectionError } from './errors.js';

// Rooms
export { buildRooms, roomSummary } from './rooms.js';

// Domain helpers
export { domainOf, isToggleable, formatEntityState, domainIcon, isFavoriteRelevant } from './domain.js';

// Room icon utilities
export { roomIconName, roomStatusIconName, CANONICAL_ROOM_ICONS } from './roomIcons.js';
export type { RoomIconName } from './roomIcons.js';

// Types
export type {
  HassEntity,
  HassEntityAttributes,
  HassEntityMap,
  WeatherForecast,
  AreaRegistryEntry,
  DeviceRegistryEntry,
  EntityRegistryEntry,
  Registries,
  Room,
  RoomSummary,
  ConnectionStatus,
  UnsubscribeFunc,
  HAUser,
  PersistentNotification,
} from './types.js';

// Demo data
export {
  DEMO_ENTITIES,
  DEMO_REGISTRIES,
  DEMO_NOTIFICATIONS,
  createDemoTicker,
  applyDemoService,
} from './demo.js';

// Devices
export {
  buildDeviceModels,
  summarizeDevices,
  deviceEntityCategory,
} from './devices.js';
export type {
  DeviceModel,
  DeviceEntityRef,
  DeviceEntityCategory,
  DevicesSummary,
} from './devices.js';

// Energy
export {
  computeEnergyDashboard,
  energyStatisticIds,
  energyPeriodRange,
  isEnergyConfigured,
  DEMO_ENERGY_PREFS,
  demoEnergyStatistics,
} from './energy.js';
export type {
  EnergyPreferences,
  EnergySource,
  GridSource,
  SolarSource,
  BatterySource,
  GasSource,
  WaterSource,
  DeviceConsumption,
  StatisticValue,
  StatisticsMap,
  StatisticsPeriod,
  EnergyPeriod,
  EnergyRange,
  EnergyDashboard,
  EnergyDeviceUsage,
  EnergyWaterUsage,
  EnergySeriesPoint,
} from './energy.js';
