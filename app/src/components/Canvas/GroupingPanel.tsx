import { useCanvas } from '../../hooks/useCanvas';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface GroupingPanelProps {
  selectedShapes: string[];
  onGroup: () => void;
  onUngroup: () => void;
}

export function GroupingPanel({ selectedShapes, onGroup, onUngroup }: GroupingPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { groupShapes, ungroupShapes, shapes } = useCanvas();

  // Check if we can group (2+ shapes selected)
  const canGroup = selectedShapes.length >= 2;

  // Check if we can ungroup (all selected shapes are in the same group)
  const canUngroup = (() => {
    if (selectedShapes.length === 0) return false;
    
    // Check if all selected shapes are in the same group
    const firstShape = shapes.find(s => s.id === selectedShapes[0]);
    if (!firstShape || !firstShape.groupId) {
      console.log('GroupingPanel: First shape not found or not in group:', firstShape);
      return false;
    }
    
    const groupId = firstShape.groupId;
    const allInSameGroup = selectedShapes.every(shapeId => {
      const shape = shapes.find(s => s.id === shapeId);
      return shape && shape.groupId === groupId;
    });
    
    console.log('GroupingPanel: canUngroup check:', {
      selectedShapes,
      firstShape: firstShape.id,
      groupId,
      allInSameGroup
    });
    
    return allInSameGroup;
  })();

  const handleGroup = async () => {
    if (!user || selectedShapes.length < 2) return;
    
    try {
      await groupShapes(selectedShapes);
      // The context's groupShapes function should maintain selection
      onGroup();
    } catch (error) {
      console.error('Failed to group shapes:', error);
      showToast('Failed to group shapes', 'error');
    }
  };

  const handleUngroup = async () => {
    if (!user || selectedShapes.length === 0) return;
    
    try {
      // Find the group ID from the first selected shape
      const firstShape = shapes.find(s => s.id === selectedShapes[0]);
      if (!firstShape || !firstShape.groupId) {
        showToast('Selected shapes are not in a group', 'error');
        return;
      }
      
      await ungroupShapes(firstShape.groupId);
      onUngroup();
    } catch (error) {
      console.error('Failed to ungroup shapes:', error);
      showToast('Failed to ungroup shapes', 'error');
    }
  };

  if (selectedShapes.length === 0) {
    return null;
  }

  return (
    <div className="grouping-panel">
      <div className="grouping-controls">
        {canGroup && (
          <button
            type="button"
            className="grouping-button group-button"
            onClick={handleGroup}
            title="Group selected shapes (Cmd/Ctrl+G)"
          >
            <span style={{fontSize: '16px'}}>🔗</span>
            <span>Group</span>
          </button>
        )}
        
        {canUngroup && (
          <button
            type="button"
            className="grouping-button ungroup-button"
            onClick={handleUngroup}
            title="Ungroup selected shapes (Cmd/Ctrl+Shift+G)"
          >
            <span style={{fontSize: '16px'}}>🔓</span>
            <span>Ungroup</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default GroupingPanel;
