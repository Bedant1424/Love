import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CatalogueView } from '../../src/components/CatalogueView';
import { CATEGORIES } from '../../src/data/catalogueData';

describe('CatalogueView Component', () => {
  const mockGetItemQuantity = vi.fn().mockReturnValue(0);
  const mockOnAddItem = vi.fn();
  const mockOnIncrement = vi.fn();
  const mockOnDecrement = vi.fn();

  it('renders all 6 authentic categories in the category navigation bar', () => {
    render(
      <CatalogueView
        getItemQuantity={mockGetItemQuantity}
        onAddItem={mockOnAddItem}
        onIncrement={mockOnIncrement}
        onDecrement={mockOnDecrement}
      />
    );

    expect(screen.getByRole('tab', { name: /all categories/i })).toBeInTheDocument();
    CATEGORIES.forEach((cat) => {
      expect(screen.getByRole('tab', { name: new RegExp(cat.name, 'i') })).toBeInTheDocument();
    });
  });

  it('renders authentic products with discrete printed price estimates and unpriced range items', () => {
    render(
      <CatalogueView
        getItemQuantity={mockGetItemQuantity}
        onAddItem={mockOnAddItem}
        onIncrement={mockOnIncrement}
        onDecrement={mockOnDecrement}
      />
    );

    // Discrete priced item: Single Shot Skyshots (₹150)
    expect(screen.getByText('Single Shot Skyshots')).toBeInTheDocument();
    expect(screen.getAllByText('₹150.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/catalogue price/i).length).toBeGreaterThan(0);

    // Range item with lower bound initial ordering price: Pandav Skyshots (Printed: ₹180 to ₹200)
    expect(screen.getByText('Pandav Skyshots')).toBeInTheDocument();
    expect(screen.getAllByText(/range: ₹180 to ₹200/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹180.00').length).toBeGreaterThan(0);
  });

  it('filters products when clicking a category tab', async () => {
    const user = userEvent.setup();
    render(
      <CatalogueView
        getItemQuantity={mockGetItemQuantity}
        onAddItem={mockOnAddItem}
        onIncrement={mockOnIncrement}
        onDecrement={mockOnDecrement}
      />
    );

    // Click on Sparklers tab
    const sparklersTab = screen.getByRole('tab', { name: /sparklers/i });
    await user.click(sparklersTab);

    // Should display sparkler products
    expect(screen.getByText('9 cm Sparklers')).toBeInTheDocument();
    expect(screen.getByText('15 cm Crackling Sparklers')).toBeInTheDocument();
    // Skyshot should not be in sparklers category
    expect(screen.queryByText(/Bigboss/i)).not.toBeInTheDocument();
  });

  it('filters products using the search input', async () => {
    const user = userEvent.setup();
    render(
      <CatalogueView
        getItemQuantity={mockGetItemQuantity}
        onAddItem={mockOnAddItem}
        onIncrement={mockOnIncrement}
        onDecrement={mockOnDecrement}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search products/i);
    await user.type(searchInput, 'elephant');

    expect(screen.getByText('Elephant Skyshots')).toBeInTheDocument();
    expect(screen.queryByText(/Bigboss/i)).not.toBeInTheDocument();
  });

  it('displays the environmental statutory notice for Category 1 (Laddis)', async () => {
    const user = userEvent.setup();
    render(
      <CatalogueView
        getItemQuantity={mockGetItemQuantity}
        onAddItem={mockOnAddItem}
        onIncrement={mockOnIncrement}
        onDecrement={mockOnDecrement}
      />
    );

    const laddisTab = screen.getByRole('tab', { name: /laddis/i });
    await user.click(laddisTab);

    expect(screen.getByText(/environmental notice/i)).toBeInTheDocument();
    expect(screen.getByText(/supreme court clean air directives/i)).toBeInTheDocument();
  });
});
