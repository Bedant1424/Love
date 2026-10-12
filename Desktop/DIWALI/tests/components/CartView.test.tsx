import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartView } from '../../src/components/CartView';
import { CartItem, CartTotals } from '../../src/types/cart';

describe('CartView Component', () => {
  const mockItems: CartItem[] = [
    {
      productId: 'cat1-sparklers-10cm',
      variantId: 'v-10cm-gold',
      productName: '10 cm Electric Sparklers',
      variantName: 'Gold 10cm',
      pricePaise: 4500,
      printedPriceText: '₹45',
      priceStatus: 'PRINTED_ESTIMATE',
      pricingOrigin: 'POSTER_EXACT',
      packInfo: '10 Pcs/Box',
      isPackInfoVerified: false,
      quantity: 2,
      lineSubtotalPaise: 9000,
    },
    {
      productId: 'cat2-ground-chakkar',
      variantId: 'v-chakkar-special',
      productName: 'Ground Chakkar',
      variantName: 'Special 10 Pcs',
      pricePaise: null,
      printedPriceText: '₹80 - ₹180',
      priceStatus: 'PRICE_ON_ENQUIRY',
      pricingOrigin: 'POSTER_RANGE',
      packInfo: '10 Pcs/Box',
      isPackInfoVerified: false,
      quantity: 1,
      lineSubtotalPaise: null,
    },
  ];

  const mockTotals: CartTotals = {
    totalQuantity: 3,
    pricedItemCount: 1,
    unpricedItemCount: 1,
    subtotalPaise: 9000,
    provisionalSubtotalPaise: 9000,
    tokenAmountPaise: 5000, // ₹50 tier for ₹90 subtotal
    remainingBalancePaise: 4000,
    canProceedToCheckout: false,
    minOrderRequirementMet: true,
    hasUnpricedItems: true,
    checkoutBlockedReason:
      'Every item in your box must have a confirmed price before proceeding to payment instructions.',
  };

  it('renders empty cart state and allows continuing shopping', () => {
    const handleContinue = vi.fn();
    render(
      <CartView
        items={[]}
        totals={{
          totalQuantity: 0,
          pricedItemCount: 0,
          unpricedItemCount: 0,
          subtotalPaise: 0,
          provisionalSubtotalPaise: 0,
          tokenAmountPaise: 5000,
          remainingBalancePaise: 0,
          canProceedToCheckout: false,
          minOrderRequirementMet: false,
          hasUnpricedItems: false,
        }}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
        onContinueShopping={handleContinue}
        onProceedToReview={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Your Shopping Cart is Empty/i)
    ).toBeInTheDocument();
    const exploreBtn = screen.getByRole('button', {
      name: /Explore 2026 Catalogue/i,
    });
    fireEvent.click(exploreBtn);
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it('renders item list, correctly differentiating priced and unpriced items with breakdown', () => {
    render(
      <CartView
        items={mockItems}
        totals={mockTotals}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
        onContinueShopping={vi.fn()}
        onProceedToReview={vi.fn()}
      />
    );

    // Check item names
    expect(screen.getByText('10 cm Electric Sparklers')).toBeInTheDocument();
    expect(screen.getByText('Ground Chakkar')).toBeInTheDocument();

    // Check priced item line subtotal: ₹90.00
    expect(
      screen.getByText(/Line Subtotal: ₹90\.00/i)
    ).toBeInTheDocument();

    // Check unpriced item notice
    expect(
      screen.getByText(/Price to be confirmed \(Range item: ₹80 - ₹180\)/i)
    ).toBeInTheDocument();

    // Check financial breakdown
    expect(
      screen.getByText(/Order Price & Advance Token Breakdown/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Order Subtotal (1 item)')).toBeInTheDocument();
    expect(screen.getByText('Advance Token Required')).toBeInTheDocument();
    expect(screen.getByText(/Balance Due upon (Pickup|Collection)/i)).toBeInTheDocument();
    expect(
      screen.getByText('Items Requiring Price Confirmation')
    ).toBeInTheDocument();
    expect(screen.getByText('1 item(s)')).toBeInTheDocument();

    // Check validation blocker notice
    expect(
      screen.getByText(
        /Every item in your box must have a confirmed price before proceeding to payment instructions/i
      )
    ).toBeInTheDocument();
  });

  it('triggers increment, decrement, and remove actions correctly', () => {
    const handleIncrement = vi.fn();
    const handleDecrement = vi.fn();
    const handleRemove = vi.fn();

    render(
      <CartView
        items={mockItems}
        totals={mockTotals}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        onClear={vi.fn()}
        onContinueShopping={vi.fn()}
        onProceedToReview={vi.fn()}
      />
    );

    // Increase first item
    const increaseBtns = screen.getAllByRole('button', {
      name: /Increase quantity/i,
    });
    fireEvent.click(increaseBtns[0]);
    expect(handleIncrement).toHaveBeenCalledWith(
      'cat1-sparklers-10cm',
      'v-10cm-gold'
    );

    // Decrease first item
    const decreaseBtns = screen.getAllByRole('button', {
      name: /Decrease quantity/i,
    });
    fireEvent.click(decreaseBtns[0]);
    expect(handleDecrement).toHaveBeenCalledWith(
      'cat1-sparklers-10cm',
      'v-10cm-gold'
    );

    // Remove first item
    const removeBtn = screen.getByRole('button', {
      name: /Remove 10 cm Electric Sparklers/i,
    });
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith(
      'cat1-sparklers-10cm',
      'v-10cm-gold'
    );
  });

  it('supports clearing cart and proceeding to review', () => {
    const handleClear = vi.fn();
    const handleReview = vi.fn();

    render(
      <CartView
        items={mockItems}
        totals={mockTotals}
        onIncrement={vi.fn()}
        onDecrement={vi.fn()}
        onRemove={vi.fn()}
        onClear={handleClear}
        onContinueShopping={vi.fn()}
        onProceedToReview={handleReview}
      />
    );

    // Clear cart
    const clearBtn = screen.getByRole('button', { name: /Clear Cart/i });
    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalledTimes(1);

    // Proceed to review
    const proceedBtn = screen.getByRole('button', {
      name: /Proceed to Review & Pay/i,
    });
    fireEvent.click(proceedBtn);
    expect(handleReview).toHaveBeenCalledTimes(1);
  });
});
