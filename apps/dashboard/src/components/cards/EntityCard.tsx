import React from 'react';
import { domainOf } from '@hapulse/core';
import type { HassEntity } from '@hapulse/core';
import { LightCard } from './LightCard';
import { ClimateCard } from './ClimateCard';
import { MediaCard } from './MediaCard';
import { CoverCard } from './CoverCard';
import { ToggleCard } from './ToggleCard';
import { SensorTile } from './SensorTile';
import { LockCard } from './LockCard';
import { CameraCard } from './CameraCard';

interface EntityCardProps {
  entity: HassEntity;
  /** Override name from customization.entityOverrides */
  name?: string;
}

function resolveName(entity: HassEntity, override?: string): string {
  return override ?? entity.attributes.friendly_name ?? entity.entity_id;
}

export function EntityCard({ entity, name: nameOverride }: EntityCardProps) {
  const domain = domainOf(entity.entity_id);
  const name = resolveName(entity, nameOverride);

  switch (domain) {
    case 'light':
      return <LightCard entity={entity} name={name} />;
    case 'climate':
      return <ClimateCard entity={entity} name={name} />;
    case 'media_player':
      return <MediaCard entity={entity} name={name} />;
    case 'cover':
      return <CoverCard entity={entity} name={name} />;
    case 'switch':
    case 'fan':
    case 'input_boolean':
      return <ToggleCard entity={entity} name={name} />;
    case 'sensor':
    case 'binary_sensor':
      return <SensorTile entity={entity} name={name} />;
    case 'lock':
      return <LockCard entity={entity} name={name} />;
    case 'camera':
      return <CameraCard entity={entity} name={name} />;
    default:
      return <SensorTile entity={entity} name={name} />;
  }
}
