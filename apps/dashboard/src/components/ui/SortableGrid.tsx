/**
 * SortableGrid — DndContext + SortableContext wrapper for a CSS grid.
 *
 * DnD is only active in edit mode. When not editing, renders children
 * inside a plain div so sliders/toggles/navigation are untouched.
 *
 * Sensors:
 *   - PointerSensor with distance:6 constraint (avoids accidental drag on tap)
 *   - TouchSensor with delay:200, tolerance:8 (long-press to initiate on touch)
 *   - KeyboardSensor for full keyboard access
 */

import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

interface SortableGridProps {
  /** Ordered list of item ids — the source of truth for SortableContext */
  items: string[];
  /** Called with the new order after a successful drag */
  onReorder: (newIds: string[]) => void;
  children: React.ReactNode;
  /** CSS class(es) applied to the grid container div */
  className?: string;
  /** Additional inline styles for the grid container */
  style?: React.CSSProperties;
  /** When false, DnD context is omitted and children render inside a plain div */
  editMode: boolean;
}

export function SortableGrid({
  items,
  onReorder,
  children,
  className,
  style,
  editMode,
}: SortableGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.indexOf(String(active.id));
    const newIndex = items.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  }

  if (!editMode) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className={className} style={style}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}
