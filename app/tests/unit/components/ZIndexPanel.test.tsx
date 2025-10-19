import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ZIndexPanel } from '../../../src/components/Canvas/ZIndexPanel';
import { useAuth } from '../../../src/hooks/useAuth';
import { useToast } from '../../../src/hooks/useToast';
import { canvasService } from '../../../src/services/canvasService';

// Mock the hooks
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../../src/hooks/useToast', () => ({
  useToast: vi.fn()
}));

// Mock the canvas service
vi.mock('../../../src/services/canvasService', () => ({
  canvasService: {
    bringToFront: vi.fn(),
    sendToBack: vi.fn(),
    bringForward: vi.fn(),
    sendBackward: vi.fn()
  }
}));

describe('ZIndexPanel Component', () => {
  const mockOnZIndexChange = vi.fn();
  const mockShowToast = vi.fn();
  const mockUser = { id: 'test-user', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    });
    
    vi.mocked(useToast).mockReturnValue({
      showToast: mockShowToast,
      hideToast: vi.fn()
    });
  });

  describe('Rendering', () => {
    it('should render all four z-index buttons', () => {
      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      expect(screen.getByText('To Front')).toBeInTheDocument();
      expect(screen.getByText('To Back')).toBeInTheDocument();
      expect(screen.getByText('Forward')).toBeInTheDocument();
      expect(screen.getByText('Backward')).toBeInTheDocument();
    });

    it('should not render when no shape is selected', () => {
      render(
        <ZIndexPanel 
          selectedShapeId={null} 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      expect(screen.queryByText('To Front')).not.toBeInTheDocument();
    });

    it('should have correct button titles for keyboard shortcuts', () => {
      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      expect(screen.getByTitle('Bring to Front (Cmd/Ctrl+Shift+])')).toBeInTheDocument();
      expect(screen.getByTitle('Send to Back (Cmd/Ctrl+Shift+[)')).toBeInTheDocument();
      expect(screen.getByTitle('Bring Forward (Cmd/Ctrl+])')).toBeInTheDocument();
      expect(screen.getByTitle('Send Backward (Cmd/Ctrl+[)')).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should call bringToFront when To Front button is clicked', async () => {
      const mockBringToFront = vi.mocked(canvasService.bringToFront);
      mockBringToFront.mockResolvedValue(undefined);

      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      fireEvent.click(screen.getByText('To Front'));

      await waitFor(() => {
        expect(mockBringToFront).toHaveBeenCalledWith('shape-123');
        expect(mockOnZIndexChange).toHaveBeenCalledWith('bringToFront');
        expect(mockShowToast).toHaveBeenCalledWith('Shape brought to front', 'success');
      });
    });

    it('should call sendToBack when To Back button is clicked', async () => {
      const mockSendToBack = vi.mocked(canvasService.sendToBack);
      mockSendToBack.mockResolvedValue(undefined);

      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      fireEvent.click(screen.getByText('To Back'));

      await waitFor(() => {
        expect(mockSendToBack).toHaveBeenCalledWith('shape-123');
        expect(mockOnZIndexChange).toHaveBeenCalledWith('sendToBack');
        expect(mockShowToast).toHaveBeenCalledWith('Shape sent to back', 'success');
      });
    });

    it('should call bringForward when Forward button is clicked', async () => {
      const mockBringForward = vi.mocked(canvasService.bringForward);
      mockBringForward.mockResolvedValue(undefined);

      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      fireEvent.click(screen.getByText('Forward'));

      await waitFor(() => {
        expect(mockBringForward).toHaveBeenCalledWith('shape-123');
        expect(mockOnZIndexChange).toHaveBeenCalledWith('bringForward');
        expect(mockShowToast).toHaveBeenCalledWith('Shape brought forward', 'success');
      });
    });

    it('should call sendBackward when Backward button is clicked', async () => {
      const mockSendBackward = vi.mocked(canvasService.sendBackward);
      mockSendBackward.mockResolvedValue(undefined);

      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      fireEvent.click(screen.getByText('Backward'));

      await waitFor(() => {
        expect(mockSendBackward).toHaveBeenCalledWith('shape-123');
        expect(mockOnZIndexChange).toHaveBeenCalledWith('sendBackward');
        expect(mockShowToast).toHaveBeenCalledWith('Shape sent backward', 'success');
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error toast when bringToFront fails', async () => {
      const mockBringToFront = vi.mocked(canvasService.bringToFront);
      mockBringToFront.mockRejectedValue(new Error('Network error'));

      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      fireEvent.click(screen.getByText('To Front'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to bring shape to front', 'error');
      });
    });

    it('should show error toast when sendToBack fails', async () => {
      const mockSendToBack = vi.mocked(canvasService.sendToBack);
      mockSendToBack.mockRejectedValue(new Error('Database error'));

      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      fireEvent.click(screen.getByText('To Back'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to send shape to back', 'error');
      });
    });

    it('should show error toast when bringForward fails', async () => {
      const mockBringForward = vi.mocked(canvasService.bringForward);
      mockBringForward.mockRejectedValue(new Error('Shape not found'));

      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      fireEvent.click(screen.getByText('Forward'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to bring shape forward', 'error');
      });
    });

    it('should show error toast when sendBackward fails', async () => {
      const mockSendBackward = vi.mocked(canvasService.sendBackward);
      mockSendBackward.mockRejectedValue(new Error('Permission denied'));

      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      fireEvent.click(screen.getByText('Backward'));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to send shape backward', 'error');
      });
    });
  });

  describe('User Authentication', () => {
    it('should not call service methods when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn()
      });

      const mockBringToFront = vi.mocked(canvasService.bringToFront);

      render(
        <ZIndexPanel 
          selectedShapeId="shape-123" 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      fireEvent.click(screen.getByText('To Front'));

      await waitFor(() => {
        expect(mockBringToFront).not.toHaveBeenCalled();
      });
    });

    it('should not call service methods when no shape is selected', async () => {
      const mockBringToFront = vi.mocked(canvasService.bringToFront);

      render(
        <ZIndexPanel 
          selectedShapeId={null} 
          onZIndexChange={mockOnZIndexChange} 
        />
      );

      // Component should not render buttons when no shape is selected
      expect(screen.queryByText('To Front')).not.toBeInTheDocument();
      expect(mockBringToFront).not.toHaveBeenCalled();
    });
  });
});
