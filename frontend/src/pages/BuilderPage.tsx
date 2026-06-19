import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import CataloguePanel from '../components/builder/CataloguePanel';
import BuilderCanvas from '../components/builder/BuilderCanvas';
import PropertiesPanel from '../components/builder/PropertiesPanel';
import BuilderTopBar from '../components/builder/BuilderTopBar';
import { FieldControlPreview } from '../components/ui/FieldControl';
import { Field } from '../types';

type FieldLocation = { groupId: string; index: number };

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.5' } },
  }),
};

function findFieldLocation(tabs: { fieldGroups: { id: string; fields: Field[] }[] }[], fieldId: string): FieldLocation | null {
  for (const tab of tabs) {
    for (const group of tab.fieldGroups) {
      const index = group.fields.findIndex((f) => f.id === fieldId);
      if (index !== -1) return { groupId: group.id, index };
    }
  }
  return null;
}

function cloneTabs(tabs: { fieldGroups: { id: string; fields: Field[]; name: string }[]; [key: string]: unknown }[]) {
  return tabs.map((tab) => ({
    ...tab,
    fieldGroups: tab.fieldGroups.map((group) => ({
      ...group,
      fields: [...group.fields],
    })),
  }));
}

function getGroup(tabs: ReturnType<typeof cloneTabs>, groupId: string) {
  for (const tab of tabs) {
    const group = tab.fieldGroups.find((g) => g.id === groupId);
    if (group) return group;
  }
  return null;
}

function moveFieldInTabs(
  tabs: ReturnType<typeof cloneTabs>,
  activeId: string,
  overId: string,
): ReturnType<typeof cloneTabs> | null {
  const sourceLoc = findFieldLocation(tabs, activeId);
  if (!sourceLoc) return null;

  let targetGroupId: string | null = null;
  let targetIndex = -1;

  if (overId.startsWith('group-')) {
    targetGroupId = overId.replace('group-', '');
  } else {
    const overLoc = findFieldLocation(tabs, overId);
    if (overLoc) {
      targetGroupId = overLoc.groupId;
      targetIndex = overLoc.index;
    }
  }

  if (!targetGroupId) return null;

  const sourceGroup = getGroup(tabs, sourceLoc.groupId);
  const targetGroup = getGroup(tabs, targetGroupId);
  if (!sourceGroup || !targetGroup) return null;

  if (sourceLoc.groupId === targetGroupId) {
    if (targetIndex >= 0) {
      if (sourceLoc.index === targetIndex) return null;
      targetGroup.fields = arrayMove(targetGroup.fields, sourceLoc.index, targetIndex);
    } else if (overId.startsWith('group-') && sourceLoc.index !== targetGroup.fields.length - 1) {
      targetGroup.fields = arrayMove(targetGroup.fields, sourceLoc.index, targetGroup.fields.length - 1);
    } else {
      return null;
    }
    return tabs;
  }

  const [movedField] = sourceGroup.fields.splice(sourceLoc.index, 1);
  if (!movedField) return null;

  const insertAt = targetIndex >= 0 ? targetIndex : targetGroup.fields.length;
  targetGroup.fields.splice(insertAt, 0, movedField);
  return tabs;
}

function FieldDragOverlay({ field, variant }: { field: Field; variant: 'catalogue' | 'canvas' }) {
  if (variant === 'catalogue') {
    return (
      <div className="bg-white border-2 border-ns-blue px-3 py-2 rounded-ns-md shadow-xl text-xs font-semibold flex items-center gap-2 w-52 cursor-grabbing pointer-events-none">
        <GripVertical size={14} className="text-ns-blue shrink-0" />
        <span className="truncate text-ns-navy">{field.label}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-ns-blue p-3 rounded-ns-md shadow-2xl w-[280px] cursor-grabbing pointer-events-none ring-4 ring-ns-blue/10">
      <div className="flex items-center gap-2 mb-1.5">
        <GripVertical size={12} className="text-ns-blue shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-ns-blue truncate">
          {field.label}
          {field.mandatory && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      </div>
      <FieldControlPreview fieldType={field.type} checkBoxDefault={field.checkBoxDefault} />
    </div>
  );
}

export default function BuilderPage() {
  const {
    currentForm,
    updateCurrentForm,
    catalogues,
    activeTabId,
    setActiveTabId,
    selectedFieldId,
    setSelectedFieldId,
    fetchCatalogue,
    fetchFormById,
  } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDragItem, setActiveDragItem] = React.useState<Field | null>(null);
  const [activeDragSource, setActiveDragSource] = React.useState<'catalogue' | 'canvas' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  React.useEffect(() => {
    const formIdFromState = (location.state as { formId?: string } | null)?.formId;

    if (formIdFromState && (!currentForm || currentForm.id !== formIdFromState)) {
      fetchFormById(formIdFromState);
    } else if (!currentForm && !formIdFromState) {
      navigate('/dashboard');
    } else if (currentForm) {
      if (!activeTabId && currentForm.tabs.length > 0) {
        setActiveTabId(currentForm.tabs[0].id);
      }
      fetchCatalogue(currentForm.transactionType);
    }
  }, [currentForm, navigate, activeTabId, fetchCatalogue, location.state, fetchFormById, setActiveTabId]);

  if (!currentForm) return null;

  const catalogue = catalogues[currentForm.transactionType];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const fieldId = active.id as string;
    const activeData = active.data.current as { source?: string; field?: Field } | undefined;

    const field =
      activeData?.field ||
      catalogue?.fields.find((f) => f.id === fieldId) ||
      currentForm.tabs.flatMap((t) => t.fieldGroups.flatMap((g) => g.fields)).find((f) => f.id === fieldId);

    if (field) {
      setActiveDragItem(field);
      setActiveDragSource(activeData?.source === 'canvas' ? 'canvas' : 'catalogue');
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !catalogue) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeData = active.data.current as { source?: string } | undefined;
    if (activeData?.source === 'catalogue') return;
    if (!findFieldLocation(currentForm.tabs, activeId)) return;

    const newTabs = cloneTabs(currentForm.tabs);
    const moved = moveFieldInTabs(newTabs, activeId, overId);
    if (moved) updateCurrentForm({ tabs: moved });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);
    setActiveDragSource(null);

    if (!over || !catalogue) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeData = active.data.current as { source?: string } | undefined;

    const isOnCanvas = Boolean(findFieldLocation(currentForm.tabs, activeId));
    const isCatalogueDrag =
      activeData?.source === 'catalogue' || (!isOnCanvas && catalogue.fields.some((f) => f.id === activeId));

    let targetGroupId: string | null = null;
    let targetIndex = -1;

    if (overId.startsWith('group-')) {
      targetGroupId = overId.replace('group-', '');
    } else {
      const overLoc = findFieldLocation(currentForm.tabs, overId);
      if (overLoc) {
        targetGroupId = overLoc.groupId;
        targetIndex = overLoc.index;
      }
    }

    if (!targetGroupId) return;

    if (isCatalogueDrag) {
      const field = catalogue.fields.find((f) => f.id === activeId);
      if (!field || isOnCanvas) return;

      const newTabs = cloneTabs(currentForm.tabs);
      const targetGroup = getGroup(newTabs, targetGroupId);
      if (!targetGroup) return;

      const insertAt = targetIndex >= 0 ? targetIndex : targetGroup.fields.length;
      targetGroup.fields.splice(insertAt, 0, field);
      updateCurrentForm({ tabs: newTabs });
      return;
    }

    if (activeId === overId) return;

    const newTabs = cloneTabs(currentForm.tabs);
    const moved = moveFieldInTabs(newTabs, activeId, overId);
    if (moved) updateCurrentForm({ tabs: moved });
  };

  const handleDragCancel = () => {
    setActiveDragItem(null);
    setActiveDragSource(null);
  };

  const selectedField = currentForm.tabs
    .flatMap((t) => t.fieldGroups.flatMap((g) => g.fields))
    .find((f) => f.id === selectedFieldId);

  return (
    <div className="h-screen flex flex-col bg-ns-page-bg overflow-hidden">
      <BuilderTopBar />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-ns-border bg-white flex flex-col shrink-0">
            <CataloguePanel />
          </div>

          <div className="flex-1 flex flex-col overflow-auto p-6 bg-ns-page-bg min-w-0">
            <BuilderCanvas
              activeTabId={activeTabId}
              setActiveTabId={setActiveTabId}
              selectedFieldId={selectedFieldId}
              setSelectedFieldId={setSelectedFieldId}
            />
          </div>

          <div className="w-80 border-l border-ns-border bg-white flex flex-col shrink-0">
            <PropertiesPanel selectedField={selectedField} />
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation} adjustScale={false}>
          {activeDragItem && activeDragSource ? (
            <FieldDragOverlay field={activeDragItem} variant={activeDragSource} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
