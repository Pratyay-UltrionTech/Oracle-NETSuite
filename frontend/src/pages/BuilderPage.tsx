import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import CataloguePanel from '../components/builder/CataloguePanel';
import BuilderCanvas from '../components/builder/BuilderCanvas';
import PropertiesPanel from '../components/builder/PropertiesPanel';
import BuilderTopBar from '../components/builder/BuilderTopBar';
import { Field, Tab, FieldGroup } from '../types';

export default function BuilderPage() {
  const { 
    currentForm, updateCurrentForm, catalogues, 
    activeTabId, setActiveTabId, 
    selectedFieldId, setSelectedFieldId,
    fetchCatalogue, fetchFormById
  } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeDragItem, setActiveDragItem] = React.useState<Field | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  React.useEffect(() => {
    const formIdFromState = (location.state as any)?.formId;
    
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
  }, [currentForm, navigate, activeTabId, fetchCatalogue, location.state, fetchFormById]);

  if (!currentForm) return null;

  const catalogue = catalogues[currentForm.transactionType];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const fieldId = active.id as string;
    
    // Check if it's from catalogue or canvas
    const field = catalogue.fields.find(f => f.id === fieldId) || 
                  currentForm.tabs.flatMap(t => t.fieldGroups.flatMap(g => g.fields)).find(f => f.id === fieldId);
    
    if (field) setActiveDragItem(field);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || !catalogue) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeData = active.data.current as { source?: string; groupId?: string } | undefined;

    const findFieldLocation = (fieldId: string) => {
      for (const tab of currentForm.tabs) {
        for (const group of tab.fieldGroups) {
          const index = group.fields.findIndex((f) => f.id === fieldId);
          if (index !== -1) return { groupId: group.id, index };
        }
      }
      return null;
    };

    const isOnCanvas = Boolean(findFieldLocation(activeId));
    const isCatalogueDrag = activeData?.source === 'catalogue' || (!isOnCanvas && catalogue.fields.some((f) => f.id === activeId));

    let targetGroupId: string | null = null;
    let targetIndex = -1;

    if (overId.startsWith('group-')) {
      targetGroupId = overId.replace('group-', '');
    } else {
      const overLoc = findFieldLocation(overId);
      if (overLoc) {
        targetGroupId = overLoc.groupId;
        targetIndex = overLoc.index;
      }
    }

    if (!targetGroupId) return;

    const newTabs = currentForm.tabs.map((tab) => ({
      ...tab,
      fieldGroups: tab.fieldGroups.map((group) => ({
        ...group,
        fields: [...group.fields],
      })),
    }));

    const getGroup = (groupId: string) => {
      for (const tab of newTabs) {
        const group = tab.fieldGroups.find((g) => g.id === groupId);
        if (group) return group;
      }
      return null;
    };

    if (isCatalogueDrag) {
      const field = catalogue.fields.find((f) => f.id === activeId);
      if (!field || isOnCanvas) return;

      const targetGroup = getGroup(targetGroupId);
      if (!targetGroup) return;

      const insertAt = targetIndex >= 0 ? targetIndex : targetGroup.fields.length;
      targetGroup.fields.splice(insertAt, 0, field);
      updateCurrentForm({ tabs: newTabs });
      return;
    }

    const sourceLoc = findFieldLocation(activeId);
    if (!sourceLoc) return;

    const sourceGroup = getGroup(sourceLoc.groupId);
    const targetGroup = getGroup(targetGroupId);
    if (!sourceGroup || !targetGroup) return;

    if (sourceLoc.groupId === targetGroupId) {
      if (targetIndex >= 0 && sourceLoc.index !== targetIndex) {
        targetGroup.fields = arrayMove(targetGroup.fields, sourceLoc.index, targetIndex);
        updateCurrentForm({ tabs: newTabs });
      } else if (overId.startsWith('group-') && sourceLoc.index !== targetGroup.fields.length - 1) {
        targetGroup.fields = arrayMove(targetGroup.fields, sourceLoc.index, targetGroup.fields.length - 1);
        updateCurrentForm({ tabs: newTabs });
      }
      return;
    }

    const [movedField] = sourceGroup.fields.splice(sourceLoc.index, 1);
    if (!movedField) return;

    let insertAt = targetIndex >= 0 ? targetIndex : targetGroup.fields.length;
    targetGroup.fields.splice(insertAt, 0, movedField);
    updateCurrentForm({ tabs: newTabs });
  };

  const selectedField = currentForm.tabs
    .flatMap(t => t.fieldGroups.flatMap(g => g.fields))
    .find(f => f.id === selectedFieldId);

  return (
    <div className="h-screen flex flex-col bg-ns-page-bg overflow-hidden">
      <BuilderTopBar />
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <div className="w-64 border-r border-ns-border bg-white flex flex-col">
            <CataloguePanel />
          </div>

          {/* Center Panel */}
          <div className="flex-1 flex flex-col overflow-auto p-6 bg-ns-page-bg">
            <BuilderCanvas 
              activeTabId={activeTabId} 
              setActiveTabId={setActiveTabId}
              selectedFieldId={selectedFieldId}
              setSelectedFieldId={setSelectedFieldId}
            />
          </div>

          {/* Right Panel */}
          <div className="w-80 border-l border-ns-border bg-white flex flex-col">
            <PropertiesPanel selectedField={selectedField} />
          </div>
        </div>

        <DragOverlay>
          {activeDragItem ? (
            <div className="bg-white border border-ns-blue p-2 rounded shadow-lg text-xs font-medium flex items-center gap-2 w-48 opacity-80">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              {activeDragItem.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
