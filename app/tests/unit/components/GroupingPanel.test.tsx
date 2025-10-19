import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GroupingPanel } from '../../../src/components/Canvas/GroupingPanel';

// Mock the hooks
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123' }
  })
}));

vi.mock('../../../src/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

vi.mock('../../../src/services/canvasService', () => ({
  canvasService: {
    groupShapes: vi.fn(),
    ungroupShapes: vi.fn()
  }
}));

describe('GroupingPanel Component', () => {
  const mockOnGroup = vi.fn();
  const mockOnUngroup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render nothing when no shapes are selected', () => {
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

    it('should render group button when 2+ shapes are selected', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      expect(screen.getByText('Group')).toBeInTheDocument();
      expect(screen.getByTitle('Group selected shapes (Cmd/Ctrl+G)')).toBeInTheDocument();
    });

    it('should render both buttons when multiple shapes are selected', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2', 'shape-3']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      expect(screen.getByText('Group')).toBeInTheDocument();
      expect(screen.getByText('Ungroup')).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should show group button for 2+ shapes', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      const groupButton = screen.getByText('Group');
      expect(groupButton).toBeInTheDocument();
      expect(groupButton.closest('button')).not.toHaveClass('disabled');
    });

    it('should show group button for 3+ shapes', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2', 'shape-3']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      const groupButton = screen.getByText('Group');
      expect(groupButton).toBeInTheDocument();
      expect(groupButton.closest('button')).not.toHaveClass('disabled');
    });

    it('should not show group button for single shape', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      expect(screen.queryByText('Group')).not.toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onGroup when group button is clicked', async () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      const groupButton = screen.getByText('Group');
      fireEvent.click(groupButton);

      expect(mockOnGroup).toHaveBeenCalledTimes(1);
    });

    it('should call onUngroup when ungroup button is clicked', async () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2', 'shape-3']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      const ungroupButton = screen.getByText('Ungroup');
      fireEvent.click(ungroupButton);

      expect(mockOnUngroup).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper title attributes', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      const groupButton = screen.getByTitle('Group selected shapes (Cmd/Ctrl+G)');
      expect(groupButton).toBeInTheDocument();
    });

    it('should have proper button types', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      const groupButton = screen.getByText('Group');
      expect(groupButton.closest('button')).toHaveAttribute('type', 'button');
    });
  });

  describe('Visual Elements', () => {
    it('should display group icon', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      // Check for the group icon (🔗)
      const groupIcon = screen.getByText('🔗');
      expect(groupIcon).toBeInTheDocument();
    });

    it('should display ungroup icon', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2', 'shape-3']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      // Check for the ungroup icon (🔓)
      const ungroupIcon = screen.getByText('🔓');
      expect(ungroupIcon).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have proper CSS classes', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      const panel = screen.getByText('Group').closest('.grouping-panel');
      expect(panel).toBeInTheDocument();

      const controls = screen.getByText('Group').closest('.grouping-controls');
      expect(controls).toBeInTheDocument();
    });

    it('should have proper button classes', () => {
      render(
        <GroupingPanel
          selectedShapes={['shape-1', 'shape-2']}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      const groupButton = screen.getByText('Group').closest('button');
      expect(groupButton).toHaveClass('grouping-button', 'group-button');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selectedShapes array', () => {
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

    it('should handle undefined selectedShapes', () => {
      render(
        <GroupingPanel
          selectedShapes={undefined as any}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      expect(screen.queryByText('Group')).not.toBeInTheDocument();
    });

    it('should handle large number of selected shapes', () => {
      const manyShapes = Array.from({ length: 10 }, (_, i) => `shape-${i}`);
      
      render(
        <GroupingPanel
          selectedShapes={manyShapes}
          onGroup={mockOnGroup}
          onUngroup={mockOnUngroup}
        />
      );

      expect(screen.getByText('Group')).toBeInTheDocument();
      expect(screen.getByText('Ungroup')).toBeInTheDocument();
    });
  });
});
