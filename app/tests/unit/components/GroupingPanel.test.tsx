import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GroupingPanel } from '../../../src/components/Canvas/GroupingPanel';
import { useAuth } from '../../../src/hooks/useAuth';
import { useToast } from '../../../src/hooks/useToast';
import { canvasService } from '../../../src/services/canvasService';
import type { Shape } from '../../../src/services/canvasService';

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
    groupShapes: vi.fn(),
    ungroupShapes: vi.fn()
  }
}));

describe('GroupingPanel Component', () => {
  const mockOnGroup = vi.fn();
  const mockOnUngroup = vi.fn();
  const mockShowToast = vi.fn();
  const mockUser = { uid: 'test-user', email: 'test@example.com' };

  const createMockShape = (id: string, groupId: string | null = null, lockedBy: string | null = null): Shape => ({
    id,
    type: 'rectangle',
    x: 100,
    y: 200,
    width: 150,
    height: 100,
    color: '#3b82f6',
    zIndex: 0,
    groupId,
    createdBy: 'test-user',
    createdAt: { toMillis: () => Date.now() } as any,
    updatedAt: { toMillis: () => Date.now() } as any,
    lockedBy,
    lockedAt: lockedBy ? { toMillis: () => Date.now() } as any : null,
  });

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
    it('should not render when no shapes are selected', () => {
      render(
        <GroupingPanel 
          selectedShapes={[]} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      expect(screen.queryByText('Group')).not.toBeInTheDocument();
      expect(screen.queryByText('Ungroup')).not.toBeInTheDocument();
    });

    it('should render Group button when 2+ shapes selected and not grouped', () => {
      const shapes = [
        createMockShape('shape-1'),
        createMockShape('shape-2')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      expect(screen.getByText('Group')).toBeInTheDocument();
      expect(screen.queryByText('Ungroup')).not.toBeInTheDocument();
    });

    it('should render Ungroup button when grouped shapes are selected', () => {
      const groupId = 'group-123';
      const shapes = [
        createMockShape('shape-1', groupId),
        createMockShape('shape-2', groupId)
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      expect(screen.queryByText('Group')).not.toBeInTheDocument();
      expect(screen.getByText('Ungroup')).toBeInTheDocument();
    });

    it('should not render Group button when only 1 shape is selected', () => {
      const shapes = [
        createMockShape('shape-1')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      expect(screen.queryByText('Group')).not.toBeInTheDocument();
    });

    it('should have correct button titles for keyboard shortcuts', () => {
      const shapes = [
        createMockShape('shape-1'),
        createMockShape('shape-2')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      expect(screen.getByTitle('Group selected shapes (Cmd/Ctrl+G)')).toBeInTheDocument();
    });
  });

  describe('Group Button Interactions', () => {
    it('should call groupShapes and show success toast when Group button is clicked', async () => {
      const mockGroupShapes = vi.mocked(canvasService.groupShapes);
      mockGroupShapes.mockResolvedValue('group-123');

      const shapes = [
        createMockShape('shape-1'),
        createMockShape('shape-2')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      const groupButton = screen.getByText('Group');
      fireEvent.click(groupButton);

      await waitFor(() => {
        expect(mockGroupShapes).toHaveBeenCalledWith(
          ['shape-1', 'shape-2'],
          'test-user',
          undefined
        );
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Grouped 2 shapes', 'success');
      });

      await waitFor(() => {
        expect(mockOnGroup).toHaveBeenCalledWith('group-123');
      });
    });

    it('should show error toast when some shapes are locked by other users', async () => {
      const shapes = [
        createMockShape('shape-1'),
        createMockShape('shape-2', null, 'other-user')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      const groupButton = screen.getByText('Group');
      fireEvent.click(groupButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Cannot group: Some shapes are locked by other users',
          'error'
        );
      });

      expect(vi.mocked(canvasService.groupShapes)).not.toHaveBeenCalled();
    });

    it('should show error toast when some shapes are already in a group', async () => {
      const shapes = [
        createMockShape('shape-1'),
        createMockShape('shape-2', 'existing-group')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      const groupButton = screen.getByText('Group');
      fireEvent.click(groupButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Cannot group: Some shapes are already in a group',
          'error'
        );
      });

      expect(vi.mocked(canvasService.groupShapes)).not.toHaveBeenCalled();
    });

    it('should show error toast when grouping fails', async () => {
      const mockGroupShapes = vi.mocked(canvasService.groupShapes);
      mockGroupShapes.mockRejectedValue(new Error('Grouping failed'));

      const shapes = [
        createMockShape('shape-1'),
        createMockShape('shape-2')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      const groupButton = screen.getByText('Group');
      fireEvent.click(groupButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to group shapes', 'error');
      });

      expect(mockOnGroup).not.toHaveBeenCalled();
    });

    it('should disable button and show loading state during grouping', async () => {
      const mockGroupShapes = vi.mocked(canvasService.groupShapes);
      let resolveGrouping: (value: string) => void;
      const groupingPromise = new Promise<string>((resolve) => {
        resolveGrouping = resolve;
      });
      mockGroupShapes.mockReturnValue(groupingPromise);

      const shapes = [
        createMockShape('shape-1'),
        createMockShape('shape-2')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      const groupButton = screen.getByText('Group');
      fireEvent.click(groupButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Grouping...')).toBeInTheDocument();
      });

      // Button should be disabled during loading
      expect(groupButton.closest('button')).toBeDisabled();

      // Resolve the promise
      resolveGrouping!('group-123');

      // Button should return to normal state
      await waitFor(() => {
        expect(screen.getByText('Group')).toBeInTheDocument();
      });
    });
  });

  describe('Ungroup Button Interactions', () => {
    it('should call ungroupShapes and show success toast when Ungroup button is clicked', async () => {
      const mockUngroupShapes = vi.mocked(canvasService.ungroupShapes);
      mockUngroupShapes.mockResolvedValue(undefined);

      const groupId = 'group-123';
      const shapes = [
        createMockShape('shape-1', groupId),
        createMockShape('shape-2', groupId)
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      const ungroupButton = screen.getByText('Ungroup');
      fireEvent.click(ungroupButton);

      await waitFor(() => {
        expect(mockUngroupShapes).toHaveBeenCalledWith('group-123');
      });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Shapes ungrouped', 'success');
      });

      await waitFor(() => {
        expect(mockOnUngroup).toHaveBeenCalled();
      });
    });

    it('should show error toast when some shapes are locked by other users during ungroup', async () => {
      const groupId = 'group-123';
      const shapes = [
        createMockShape('shape-1', groupId),
        createMockShape('shape-2', groupId, 'other-user')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      const ungroupButton = screen.getByText('Ungroup');
      fireEvent.click(ungroupButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Cannot ungroup: Some shapes are locked by other users',
          'error'
        );
      });

      expect(vi.mocked(canvasService.ungroupShapes)).not.toHaveBeenCalled();
    });

    it('should show error toast when ungrouping fails', async () => {
      const mockUngroupShapes = vi.mocked(canvasService.ungroupShapes);
      mockUngroupShapes.mockRejectedValue(new Error('Ungrouping failed'));

      const groupId = 'group-123';
      const shapes = [
        createMockShape('shape-1', groupId),
        createMockShape('shape-2', groupId)
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      const ungroupButton = screen.getByText('Ungroup');
      fireEvent.click(ungroupButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Failed to ungroup shapes', 'error');
      });

      expect(mockOnUngroup).not.toHaveBeenCalled();
    });

    it('should disable button and show loading state during ungrouping', async () => {
      const mockUngroupShapes = vi.mocked(canvasService.ungroupShapes);
      let resolveUngrouping: () => void;
      const ungroupingPromise = new Promise<void>((resolve) => {
        resolveUngrouping = resolve;
      });
      mockUngroupShapes.mockReturnValue(ungroupingPromise);

      const groupId = 'group-123';
      const shapes = [
        createMockShape('shape-1', groupId),
        createMockShape('shape-2', groupId)
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      const ungroupButton = screen.getByText('Ungroup');
      fireEvent.click(ungroupButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Ungrouping...')).toBeInTheDocument();
      });

      // Button should be disabled during loading
      expect(ungroupButton.closest('button')).toBeDisabled();

      // Resolve the promise
      resolveUngrouping!();

      // Button should return to normal state
      await waitFor(() => {
        expect(screen.getByText('Ungroup')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle user not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn()
      });

      const shapes = [
        createMockShape('shape-1'),
        createMockShape('shape-2')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      // Button should still render but not work without user
      const groupButton = screen.getByText('Group');
      fireEvent.click(groupButton);

      expect(vi.mocked(canvasService.groupShapes)).not.toHaveBeenCalled();
    });

    it('should handle mixed selection (some grouped, some not)', () => {
      const shapes = [
        createMockShape('shape-1', 'group-123'),
        createMockShape('shape-2'), // Not grouped
        createMockShape('shape-3', 'group-123')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      // Should show Group button since not all shapes are in the same group
      expect(screen.getByText('Group')).toBeInTheDocument();
      expect(screen.queryByText('Ungroup')).not.toBeInTheDocument();
    });

    it('should handle shapes in different groups', () => {
      const shapes = [
        createMockShape('shape-1', 'group-123'),
        createMockShape('shape-2', 'group-456')
      ];

      render(
        <GroupingPanel 
          selectedShapes={shapes} 
          onGroup={mockOnGroup} 
          onUngroup={mockOnUngroup} 
        />
      );

      // Should show Group button since shapes are in different groups
      expect(screen.getByText('Group')).toBeInTheDocument();
      expect(screen.queryByText('Ungroup')).not.toBeInTheDocument();
    });
  });
});
