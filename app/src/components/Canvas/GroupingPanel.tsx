import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { canvasService, type Shape } from '../../services/canvasService';

interface GroupingPanelProps {
  selectedShapes: Shape[];
  onGroup: (groupId: string) => void;
  onUngroup: () => void;
}

export function GroupingPanel({ selectedShapes, onGroup, onUngroup }: GroupingPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Check if we have at least 2 shapes selected
  const canGroup = selectedShapes.length >= 2;

  // Check if all selected shapes belong to the same group
  const groupId = selectedShapes.length > 0 ? selectedShapes[0].groupId : null;
  const allInSameGroup = groupId && selectedShapes.every(shape => shape.groupId === groupId);
  const canUngroup = allInSameGroup;

  const handleGroup = async () => {
    if (!user || !canGroup || isLoading) return;
    
    // Check if any shape is locked by another user
    const lockedShapes = selectedShapes.filter(
      shape => shape.lockedBy && shape.lockedBy !== user.uid
    );
    
    if (lockedShapes.length > 0) {
      showToast('Cannot group: Some shapes are locked by other users', 'error');
      return;
    }

    // Check if any shape is already in a group
    const groupedShapes = selectedShapes.filter(shape => shape.groupId);
    if (groupedShapes.length > 0) {
      showToast('Cannot group: Some shapes are already in a group', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const shapeIds = selectedShapes.map(shape => shape.id);
      const newGroupId = await canvasService.groupShapes(shapeIds, user.uid);
      onGroup(newGroupId);
      showToast(`Grouped ${selectedShapes.length} shapes`, 'success');
    } catch (error) {
      console.error('Failed to group shapes:', error);
      showToast('Failed to group shapes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUngroup = async () => {
    if (!user || !canUngroup || !groupId || isLoading) return;
    
    // Check if any shape is locked by another user
    const lockedShapes = selectedShapes.filter(
      shape => shape.lockedBy && shape.lockedBy !== user.uid
    );
    
    if (lockedShapes.length > 0) {
      showToast('Cannot ungroup: Some shapes are locked by other users', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      await canvasService.ungroupShapes(groupId);
      onUngroup();
      showToast('Shapes ungrouped', 'success');
    } catch (error) {
      console.error('Failed to ungroup shapes:', error);
      showToast('Failed to ungroup shapes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show panel if no shapes are selected
  if (selectedShapes.length === 0) {
    return null;
  }

  return (
    <div className="grouping-panel">
      <div className="grouping-controls">
        {canGroup && !allInSameGroup && (
          <button
            type="button"
            className="grouping-button group-button"
            onClick={handleGroup}
            disabled={isLoading}
            title="Group selected shapes (Cmd/Ctrl+G)"
          >
            <span style={{fontSize: '16px'}}>📦</span>
            <span>{isLoading ? 'Grouping...' : 'Group'}</span>
          </button>
        )}
        
        {canUngroup && (
          <button
            type="button"
            className="grouping-button ungroup-button"
            onClick={handleUngroup}
            disabled={isLoading}
            title="Ungroup selected shapes (Cmd/Ctrl+Shift+G)"
          >
            <span style={{fontSize: '16px'}}>📂</span>
            <span>{isLoading ? 'Ungrouping...' : 'Ungroup'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default GroupingPanel;
