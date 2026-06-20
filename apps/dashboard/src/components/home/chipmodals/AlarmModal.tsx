import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { Modal } from '../../ui/Modal';
import { EmptyState } from '../../ui/EmptyState';
import { AlarmPanelCard } from '../../security/AlarmPanelCard';
import { useEntityStore } from '../../../stores/entityStore';

interface AlarmModalProps {
  open: boolean;
  onClose: () => void;
}

export function AlarmModal({ open, onClose }: AlarmModalProps) {
  const alarm = useEntityStore(
    useShallow((s) =>
      Object.values(s.entities).find((e) =>
        e.entity_id.startsWith('alarm_control_panel.')
      )
    )
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Alarm"
      icon={<ShieldAlert size={20} strokeWidth={1.75} />}
    >
      {!alarm ? (
        <EmptyState
          icon={<ShieldAlert size={32} strokeWidth={1.5} />}
          title="no alarm panel found"
          description="add an alarm_control_panel entity in home assistant."
        />
      ) : (
        <div className="alarm-modal__content">
          <AlarmPanelCard entity={alarm} />
        </div>
      )}
    </Modal>
  );
}
