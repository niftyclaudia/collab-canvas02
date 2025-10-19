import { useState } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import { NewCanvasDialog } from '../Canvas/NewCanvasDialog';
import './Dashboard.css';

export function Dashboard() {
  const {
    availableCanvases,
    isLoadingCanvases,
    switchCanvas,
    setShowDashboard,
  } = useCanvas();
  
  const [isNewCanvasDialogOpen, setIsNewCanvasDialogOpen] = useState(false);

  const handleCanvasSelect = async (canvasId: string) => {
    await switchCanvas(canvasId);
    setShowDashboard(false);
  };

  const handleCreateNew = () => {
    setIsNewCanvasDialogOpen(true);
  };

  const handleNewCanvasDialogClose = () => {
    setIsNewCanvasDialogOpen(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (isLoadingCanvases) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Your Projects</h1>
        </div>
        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Your Projects</h1>
        <button 
          className="create-project-btn"
          onClick={handleCreateNew}
        >
          + New Project
        </button>
      </div>

      <div className="projects-grid">
        {availableCanvases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button 
              className="create-first-project-btn"
              onClick={handleCreateNew}
            >
              Create Project
            </button>
          </div>
        ) : (
          availableCanvases.map((canvas) => (
            <div 
              key={canvas.id} 
              className="project-card"
              onClick={() => handleCanvasSelect(canvas.id)}
            >
              <div className="project-thumbnail">
                {canvas.thumbnail ? (
                  <img src={canvas.thumbnail} alt={canvas.name} />
                ) : (
                  <div className="default-thumbnail">
                    <div className="thumbnail-placeholder">📄</div>
                  </div>
                )}
              </div>
              <div className="project-info">
                <h3 className="project-name">{canvas.name}</h3>
                <p className="project-date">
                  Updated {formatDate(canvas.updatedAt)}
                </p>
                <div className="project-meta">
                  <span className={`project-visibility ${canvas.isShared ? 'shared' : 'private'}`}>
                    {canvas.isShared ? 'Team' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isNewCanvasDialogOpen && (
        <NewCanvasDialog
          isOpen={isNewCanvasDialogOpen}
          onClose={handleNewCanvasDialogClose}
        />
      )}
    </div>
  );
}

export default Dashboard;
