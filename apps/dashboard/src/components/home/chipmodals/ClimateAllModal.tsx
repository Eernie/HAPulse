import React from 'react';
import { Thermometer } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Modal } from '../../ui/Modal';
import { EmptyState } from '../../ui/EmptyState';
import { ClimateCard } from '../../cards/ClimateCard';
import { useEntityStore } from '../../../stores/entityStore';
import './all-modal.css';

interface ClimateAllModalProps {
  open: boolean;
  onClose: () => void;
}

export function ClimateAllModal({ open, onClose }: ClimateAllModalProps) {
  const climateEntities = useEntityStore(
    useShallow((s) =>
      Object.values(s.entities)
        .filter((e) => e.entity_id.startsWith('climate.'))
        .sort((a, b) => {
          const na = (a.attributes.friendly_name as string | undefined) ?? a.entity_id;
          const nb = (b.attributes.friendly_name as string | undefined) ?? b.entity_id;
          return na.localeCompare(nb);
        })
    )
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Climate"
      icon={<Thermometer size={20} strokeWidth={1.75} />}
    >
      {climateEntities.length === 0 ? (
        <EmptyState
          icon={<Thermometer size={32} strokeWidth={1.5} />}
          title="no climate entities"
          description="add climate entities in home assistant to control them here."
        />
      ) : (
        <div className="all-modal__grid">
          {climateEntities.map((entity) => {
            const name =
              (entity.attributes.friendly_name as string | undefined) ??
              entity.entity_id.split('.')[1]?.replace(/_/g, ' ') ??
              entity.entity_id;
            return (
              <ClimateCard key={entity.entity_id} entity={entity} name={name} />
            );
          })}
        </div>
      )}
    </Modal>
  );
}
