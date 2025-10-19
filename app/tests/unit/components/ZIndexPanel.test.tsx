import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ZIndexPanel from '../../../src/components/Canvas/ZIndexPanel';
import { useAuth } from '../../../src/hooks/useAuth';
import { useToast } from '../../../src/hooks/useToast';
import { canvasService } from '../../../src/services/canvasService';

// Mock the hooks
vi.mock('../../../src/hooks/useAuth');
vi.mock('../../../src/hooks/useToast');
vi.mock('../../../src/services/canvasService');

const mockUseAuth = vi.mocked(useAuth);
const mockUseToast = vi.mocked(useToast);
const mockCanvasService = vi.mocked(canvasService);

describe('ZIndexPanel', () => {
  const mockUser = { uid: 'test-user', email: 'test@example.com' };
  const mockShowToast = vi.fn();
  const mockOnZIndexChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false, error: null });
    mockUseToast.mockReturnValue({ showToast: mockShowToast });
  });

  it('renders nothing when no shape is selected', () => {
    render(
      <ZIndexPanel 
        selectedShapeId={null} 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    expect(screen.queryByText('To Front')).not.toBeInTheDocument();
  });

  it('renders all four z-index buttons when shape is selected', () => {
    render(
      <ZIndexPanel 
        selectedShapeId="test-shape-id" 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    expect(screen.getByText('To Front')).toBeInTheDocument();
    expect(screen.getByText('To Back')).toBeInTheDocument();
    expect(screen.getByText('Forward')).toBeInTheDocument();
    expect(screen.getByText('Backward')).toBeInTheDocument();
  });

  it('calls bringToFront when To Front button is clicked', async () => {
    mockCanvasService.bringToFront.mockResolvedValue();
    
    render(
      <ZIndexPanel 
        selectedShapeId="test-shape-id" 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    const toFrontButton = screen.getByText('To Front');
    fireEvent.click(toFrontButton);
    
    await waitFor(() => {
      expect(mockCanvasService.bringToFront).toHaveBeenCalledWith('test-shape-id');
      expect(mockOnZIndexChange).toHaveBeenCalledWith('bringToFront');
      expect(mockShowToast).toHaveBeenCalledWith('Shape brought to front', 'success');
    });
  });

  it('calls sendToBack when To Back button is clicked', async () => {
    mockCanvasService.sendToBack.mockResolvedValue();
    
    render(
      <ZIndexPanel 
        selectedShapeId="test-shape-id" 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    const toBackButton = screen.getByText('To Back');
    fireEvent.click(toBackButton);
    
    await waitFor(() => {
      expect(mockCanvasService.sendToBack).toHaveBeenCalledWith('test-shape-id');
      expect(mockOnZIndexChange).toHaveBeenCalledWith('sendToBack');
      expect(mockShowToast).toHaveBeenCalledWith('Shape sent to back', 'success');
    });
  });

  it('calls bringForward when Forward button is clicked', async () => {
    mockCanvasService.bringForward.mockResolvedValue();
    
    render(
      <ZIndexPanel 
        selectedShapeId="test-shape-id" 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    const forwardButton = screen.getByText('Forward');
    fireEvent.click(forwardButton);
    
    await waitFor(() => {
      expect(mockCanvasService.bringForward).toHaveBeenCalledWith('test-shape-id');
      expect(mockOnZIndexChange).toHaveBeenCalledWith('bringForward');
      expect(mockShowToast).toHaveBeenCalledWith('Shape brought forward', 'success');
    });
  });

  it('calls sendBackward when Backward button is clicked', async () => {
    mockCanvasService.sendBackward.mockResolvedValue();
    
    render(
      <ZIndexPanel 
        selectedShapeId="test-shape-id" 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    const backwardButton = screen.getByText('Backward');
    fireEvent.click(backwardButton);
    
    await waitFor(() => {
      expect(mockCanvasService.sendBackward).toHaveBeenCalledWith('test-shape-id');
      expect(mockOnZIndexChange).toHaveBeenCalledWith('sendBackward');
      expect(mockShowToast).toHaveBeenCalledWith('Shape sent backward', 'success');
    });
  });

  it('shows loading state during operations', async () => {
    mockCanvasService.bringToFront.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(
      <ZIndexPanel 
        selectedShapeId="test-shape-id" 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    const toFrontButton = screen.getByText('To Front');
    fireEvent.click(toFrontButton);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(toFrontButton).toBeDisabled();
  });

  it('handles errors gracefully', async () => {
    const error = new Error('Network error');
    mockCanvasService.bringToFront.mockRejectedValue(error);
    
    render(
      <ZIndexPanel 
        selectedShapeId="test-shape-id" 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    const toFrontButton = screen.getByText('To Front');
    fireEvent.click(toFrontButton);
    
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to bring shape to front', 'error');
    });
  });

  it('does not call service when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, error: null });
    
    render(
      <ZIndexPanel 
        selectedShapeId="test-shape-id" 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    const toFrontButton = screen.getByText('To Front');
    fireEvent.click(toFrontButton);
    
    expect(mockCanvasService.bringToFront).not.toHaveBeenCalled();
  });

  it('shows correct tooltips for keyboard shortcuts', () => {
    render(
      <ZIndexPanel 
        selectedShapeId="test-shape-id" 
        onZIndexChange={mockOnZIndexChange} 
      />
    );
    
    expect(screen.getByTitle('Bring to Front (Cmd/Ctrl+Shift+])')).toBeInTheDocument();
    expect(screen.getByTitle('Send to Back (Cmd/Ctrl+Shift+[)')).toBeInTheDocument();
    expect(screen.getByTitle('Bring Forward (Cmd/Ctrl+])')).toBeInTheDocument();
    expect(screen.getByTitle('Send Backward (Cmd/Ctrl+[)')).toBeInTheDocument();
  });
});