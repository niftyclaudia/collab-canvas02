import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useCanvas } from '../../hooks/useCanvas';
import { canvasService } from '../../services/canvasService';

interface FloatingToolsPanelProps {
  selectedShapes: string[];
  shapes: any[];
}

export function FloatingToolsPanel({ selectedShapes, shapes }: FloatingToolsPanelProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { groupShapes, ungroupShapes } = useCanvas();
  
  // Panel state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Refs
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('floating-tools-panel-position');
    const savedCollapsed = localStorage.getItem('floating-tools-panel-collapsed');
    
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (error) {
        console.warn('Failed to parse saved panel position:', error);
        // Fallback to bottom positioning if saved position is invalid
        setPosition({ x: 20, y: window.innerHeight - 300 });
      }
    } else {
      // Default to bottom-left if no saved position
      setPosition({ x: 20, y: window.innerHeight - 300 });
    }
    
    if (savedCollapsed) {
      setIsCollapsed(JSON.parse(savedCollapsed));
    }
  }, []);

  // Save position and collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('floating-tools-panel-position', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('floating-tools-panel-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Handle drag start - improved for easier dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Allow dragging from anywhere in the header area, not just the exact header element
    const target = e.target as HTMLElement;
    const header = target.closest('.floating-panel-header');
    if (!header) return;
    
    setIsDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Handle drag move - improved for smoother dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    e.preventDefault();
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Get panel dimensions for better boundary checking
    const panel = panelRef.current;
    const panelWidth = panel?.offsetWidth || 300;
    const panelHeight = panel?.offsetHeight || 200;
    
    // Keep panel within viewport bounds with some padding
    const padding = 10;
    const maxX = window.innerWidth - panelWidth - padding;
    const maxY = window.innerHeight - panelHeight - padding;
    
    setPosition({
      x: Math.max(padding, Math.min(newX, maxX)),
      y: Math.max(padding, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize - reposition if off-screen
  useEffect(() => {
    const handleResize = () => {
      const panel = panelRef.current;
      if (!panel) return;
      
      const rect = panel.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      if (rect.right > window.innerWidth || rect.bottom > window.innerHeight) {
        setPosition({
          x: Math.max(0, Math.min(position.x, maxX)),
          y: Math.max(0, Math.min(position.y, maxY))
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Don't show panel if no shapes selected
  if (selectedShapes.length === 0) {
    return null;
  }

  // Grouping logic - improved to handle edge cases
  const selectedShapesInGroup = selectedShapes.filter(shapeId => {
    const shape = shapes.find(s => s.id === shapeId);
    return shape && shape.groupId;
  });
  
  // Check if all selected shapes are in the same group
  let allInSameGroup = false;
  let canGroup = false;
  let canUngroup = false;
  
  if (selectedShapes.length >= 2) {
    const firstShape = shapes.find(s => s.id === selectedShapes[0]);
    if (firstShape && firstShape.groupId) {
      // Check if all shapes are in the same group
      allInSameGroup = selectedShapes.every(shapeId => {
        const shape = shapes.find(s => s.id === shapeId);
        return shape && shape.groupId === firstShape.groupId;
      });
    }
    
    // Can group if not all in same group AND not all already grouped
    canGroup = !allInSameGroup && !selectedShapes.every(shapeId => {
      const shape = shapes.find(s => s.id === shapeId);
      return shape && shape.groupId;
    });
    canUngroup = allInSameGroup; // Can ungroup if all in same group
  } else if (selectedShapes.length === 1) {
    // Single selection - check if it's in a group
    const shape = shapes.find(s => s.id === selectedShapes[0]);
    canUngroup = Boolean(shape && shape.groupId);
    canGroup = false;
  }

  // Grouping handlers
  const handleGroup = async () => {
    if (!user || selectedShapes.length < 2) return;
    
    try {
      await groupShapes(selectedShapes);
      showToast('Shapes grouped', 'success');
    } catch (error) {
      console.error('Failed to group shapes:', error);
      showToast('Failed to group shapes', 'error');
    }
  };

  const handleUngroup = async () => {
    if (!user || selectedShapes.length === 0) return;
    
    try {
      const firstShape = shapes.find(s => s.id === selectedShapes[0]);
      if (!firstShape || !firstShape.groupId) {
        showToast('Selected shapes are not in a group', 'error');
        return;
      }
      
      await ungroupShapes(firstShape.groupId);
      showToast('Shapes ungrouped', 'success');
    } catch (error) {
      console.error('Failed to ungroup shapes:', error);
      showToast('Failed to ungroup shapes', 'error');
    }
  };

  // Z-index handlers
  const handleBringToFront = async () => {
    if (!user || selectedShapes.length === 0) return;
    try {
      await canvasService.bringToFront(selectedShapes[0]);
      showToast('Shape brought to front', 'success');
    } catch (error) {
      console.error('Failed to bring shape to front:', error);
      showToast('Failed to bring shape to front', 'error');
    }
  };

  const handleSendToBack = async () => {
    if (!user || selectedShapes.length === 0) return;
    try {
      await canvasService.sendToBack(selectedShapes[0]);
      showToast('Shape sent to back', 'success');
    } catch (error) {
      console.error('Failed to send shape to back:', error);
      showToast('Failed to send shape to back', 'error');
    }
  };

  const handleBringForward = async () => {
    if (!user || selectedShapes.length === 0) return;
    try {
      await canvasService.bringForward(selectedShapes[0]);
      showToast('Shape brought forward', 'success');
    } catch (error) {
      console.error('Failed to bring shape forward:', error);
      showToast('Failed to bring shape forward', 'error');
    }
  };

  const handleSendBackward = async () => {
    if (!user || selectedShapes.length === 0) return;
    try {
      await canvasService.sendBackward(selectedShapes[0]);
      showToast('Shape sent backward', 'success');
    } catch (error) {
      console.error('Failed to send shape backward:', error);
      showToast('Failed to send shape backward', 'error');
    }
  };

  // Handle button clicks to prevent event bubbling
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };


  return (
    <div
      ref={panelRef}
      className={`floating-tools-panel ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        pointerEvents: isDragging ? 'none' : 'auto'
      }}
    >
      <div className="floating-panel-header" onMouseDown={handleMouseDown}>
        <div className="floating-panel-title">
          <span className="floating-panel-drag-handle">⋮⋮</span>
          <span>Advanced Tools</span>
          <span className="floating-panel-count">({selectedShapes.length} selected)</span>
        </div>
        <div className="floating-panel-controls">
          <button
            type="button"
            className="floating-panel-toggle"
            onClick={(e) => {
              handleButtonClick(e);
              setIsCollapsed(!isCollapsed);
            }}
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="floating-panel-content">
          {/* Always show some content when shapes are selected */}
          {selectedShapes.length > 0 && (
            <div className="floating-panel-section">
              <div className="floating-panel-section-title">Selection Info</div>
              <div style={{ fontSize: '12px', color: '#666', padding: '4px' }}>
                {selectedShapes.length} shape{selectedShapes.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}

          {/* Grouping Controls */}
          {(canGroup || canUngroup) && (
            <div className="floating-panel-section">
              <div className="floating-panel-section-title">Grouping</div>
              <div className="floating-panel-buttons">
                {canGroup && (
                  <button
                    type="button"
                    className="floating-panel-button group-button"
                    onClick={(e) => {
                      handleButtonClick(e);
                      handleGroup();
                    }}
                    title="Group selected shapes (Cmd/Ctrl+G)"
                  >
                    <span className="floating-panel-button-icon">🔗</span>
                    <span>Group</span>
                  </button>
                )}
                {canUngroup && (
                  <button
                    type="button"
                    className="floating-panel-button ungroup-button"
                    onClick={(e) => {
                      handleButtonClick(e);
                      handleUngroup();
                    }}
                    title="Ungroup selected shapes (Cmd/Ctrl+Shift+G)"
                  >
                    <span className="floating-panel-button-icon">🔓</span>
                    <span>Ungroup</span>
                  </button>
                )}
              </div>
            </div>
          )}


          {/* Z-Index Controls - Only show for single selection */}
          {selectedShapes.length === 1 && (
            <div className="floating-panel-section">
              <div className="floating-panel-section-title">Layer Order</div>
              <div className="floating-panel-buttons z-index-buttons-horizontal">
                <button
                  type="button"
                  className="floating-panel-button z-index-button bring-to-front"
                  onClick={(e) => {
                    handleButtonClick(e);
                    handleBringToFront();
                  }}
                  title="Bring to Front (Cmd/Ctrl+Shift+])"
                >
                  <span className="floating-panel-button-icon">⬆️🔝</span>
                  <span>To Front</span>
                </button>
                <button
                  type="button"
                  className="floating-panel-button z-index-button send-to-back"
                  onClick={(e) => {
                    handleButtonClick(e);
                    handleSendToBack();
                  }}
                  title="Send to Back (Cmd/Ctrl+Shift+[)"
                >
                  <span className="floating-panel-button-icon">⬇️⬇️</span>
                  <span>To Back</span>
                </button>
                <button
                  type="button"
                  className="floating-panel-button z-index-button bring-forward"
                  onClick={(e) => {
                    handleButtonClick(e);
                    handleBringForward();
                  }}
                  title="Bring Forward (Cmd/Ctrl+])"
                >
                  <span className="floating-panel-button-icon">⬆️</span>
                  <span>Forward</span>
                </button>
                <button
                  type="button"
                  className="floating-panel-button z-index-button send-backward"
                  onClick={(e) => {
                    handleButtonClick(e);
                    handleSendBackward();
                  }}
                  title="Send Backward (Cmd/Ctrl+[)"
                >
                  <span className="floating-panel-button-icon">⬇️</span>
                  <span>Backward</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FloatingToolsPanel;
