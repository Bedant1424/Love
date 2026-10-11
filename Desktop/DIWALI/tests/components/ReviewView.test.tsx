import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewView } from '../../src/components/ReviewView';
import { CartItem, CartTotals } from '../../src/types/cart';
import { CustomerDetails } from '../../src/types/customer';

describe('ReviewView Component', () => {
  const mockCustomer: CustomerDetails = {
    fullName: 'Ramesh Patel',
    mobileNumber: '9876543210',
    fulfilmentPreference: 'COUNTER_PICKUP',
    ageConfirmed: true,
    notes: 'Please pack carefully.',
  };

  const mockPricedItems: CartItem[] = [
    {
      productId: 'cat1-sparklers-10cm',
      variantId: 'v-10cm-gold',
      productName: '10 cm Electric Sparklers',
      variantName: 'Gold 10cm',
      pricePaise: 18000,
      printedPriceText: '₹180',
      priceStatus: 'PRINTED_ESTIMATE',
      pricingOrigin: 'POSTER_EXACT',
      packInfo: '10 pkts × 10 pcs',
      isPackInfoVerified: false,
      quantity: 2,
      lineSubtotalPaise: 36000,
    },
  ];

  const mockValidTotals: CartTotals = {
    totalQuantity: 2,
    pricedItemCount: 1,
    unpricedItemCount: 0,
    subtotalPaise: 36000,
    provisionalSubtotalPaise: 36000,
    tokenAmountPaise: 10000,
    remainingBalancePaise: 26000,
    canProceedToCheckout: true,
    minOrderRequirementMet: true,
    hasUnpricedItems: false,
    checkoutBlockedReason: undefined,
  };

  const mockUnpricedTotals: CartTotals = {
    totalQuantity: 3,
    pricedItemCount: 1,
    unpricedItemCount: 1,
    subtotalPaise: 36000,
    provisionalSubtotalPaise: 36000,
    tokenAmountPaise: 10000,
    remainingBalancePaise: 26000,
    canProceedToCheckout: false,
    minOrderRequirementMet: true,
    hasUnpricedItems: true,
    checkoutBlockedReason:
      'Every item in your box must have a confirmed price before proceeding to simulated payment.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer details, items, financial breakdown, and portfolio demo notice', () => {
    render(
      <ReviewView
        customer={mockCustomer}
        items={mockPricedItems}
        totals={mockValidTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
      />
    );

    // Customer info
    expect(screen.getByText('Ramesh Patel')).toBeInTheDocument();
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
    expect(screen.getAllByText(/Store Counter Pickup/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Confirmed 18\+ years of age/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Please pack carefully/i).length).toBeGreaterThan(0);

    // Item info
    expect(
      screen.getByText(/10 cm Electric Sparklers \(Gold 10cm\)/i)
    ).toBeInTheDocument();

    // Financial breakdown with ₹100 token
    expect(screen.getAllByText(/₹360\.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₹100\.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₹260\.00/i).length).toBeGreaterThan(0);

    // Portfolio demo notices
    expect(
      screen.getAllByText(/Portfolio Demo Only\. No real orders, fireworks sales, delivery, or payments are processed\./i).length
    ).toBeGreaterThan(0);
  });

  it('shows missing customer details alert if details are incomplete', () => {
    const incompleteCustomer: CustomerDetails = {
      fullName: '',
      mobileNumber: '',
      fulfilmentPreference: 'COUNTER_PICKUP',
      ageConfirmed: false,
      notes: '',
    };
    const handleEditCustomer = vi.fn();

    render(
      <ReviewView
        customer={incompleteCustomer}
        items={mockPricedItems}
        totals={mockValidTotals}
        onEditCustomer={handleEditCustomer}
        onEditCart={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Contact details are incomplete/i)
    ).toBeInTheDocument();
    const fillBtn = screen.getByRole('button', { name: /Fill Details/i });
    fireEvent.click(fillBtn);
    expect(handleEditCustomer).toHaveBeenCalledTimes(1);
  });

  it('copies demo summary to clipboard on click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ReviewView
        customer={mockCustomer}
        items={mockPricedItems}
        totals={mockValidTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
      />
    );

    const copyBtn = screen.getByRole('button', {
      name: /Copy Demo Summary/i,
    });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(/Summary Copied to Clipboard!/i)
      ).toBeInTheDocument();
    });
  });

  it('executes simulated payment flow and generates demo confirmation record', async () => {
    const handleReset = vi.fn();
    render(
      <ReviewView
        customer={mockCustomer}
        items={mockPricedItems}
        totals={mockValidTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
        onResetOrder={handleReset}
      />
    );

    const checkoutBtn = screen.getByRole('button', {
      name: /Proceed to Simulated Payment/i,
    });
    expect(checkoutBtn).not.toBeDisabled();
    fireEvent.click(checkoutBtn);

    // Enters simulated pending state modal/view
    expect(
      screen.getByText(/Fixed ₹100 Demo Token Payment/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Simulating Payment Authorization\.\.\./i)
    ).toBeInTheDocument();

    // Trigger test success action
    const simulateSuccessBtn = screen.getByRole('button', {
      name: /Simulate Successful Payment \(Test Success\)/i,
    });
    fireEvent.click(simulateSuccessBtn);

    // Resolves to simulated success state
    expect(
      screen.getByText(/Demo Order Confirmation/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/DEMO-NT-/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Simulated Token Paid:/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Remaining Balance:/i)
    ).toBeInTheDocument();

    // Test reset demo order
    const startNewBtn = screen.getByRole('button', {
      name: /Start New Demo Order/i,
    });
    fireEvent.click(startNewBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('handles simulated payment failure state and allows retrying', () => {
    render(
      <ReviewView
        customer={mockCustomer}
        items={mockPricedItems}
        totals={mockValidTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
      />
    );

    const checkoutBtn = screen.getByRole('button', {
      name: /Proceed to Simulated Payment/i,
    });
    fireEvent.click(checkoutBtn);

    // Trigger simulated failure
    const simulateFailureBtn = screen.getByRole('button', {
      name: /Simulate Payment Failure \(Test Error\)/i,
    });
    fireEvent.click(simulateFailureBtn);

    // Displays failure message
    expect(
      screen.getByText(/Simulated Payment Failed/i)
    ).toBeInTheDocument();

    // Displays retry action
    const retryBtn = screen.getByRole('button', {
      name: /Retry Simulated Payment/i,
    });
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);

    // Returns to pending screen
    expect(
      screen.getByText(/Simulating Payment Authorization\.\.\./i)
    ).toBeInTheDocument();
  });

  it('disables checkout action when unpriced items exist', () => {
    render(
      <ReviewView
        customer={mockCustomer}
        items={mockPricedItems}
        totals={mockUnpricedTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
      />
    );

    const checkoutBtn = screen.getByRole('button', {
      name: /Proceed to Simulated Payment/i,
    });
    expect(checkoutBtn).toBeDisabled();
    expect(
      screen.getAllByText(/Every item in your box must have a confirmed price/i).length
    ).toBeGreaterThan(0);
  });

  it('never renders live payment inputs, UPI ID fields, or live payment links', () => {
    render(
      <ReviewView
        customer={mockCustomer}
        items={mockPricedItems}
        totals={mockValidTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
      />
    );

    // Verify absence of payment form elements
    expect(screen.queryByLabelText(/UPI ID/i)).toBeNull();
    expect(screen.queryByLabelText(/Card Number/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Pay Now$/i })).toBeNull();
  });

  it('navigates back to customer form or cart on edit button clicks', () => {
    const handleEditCustomer = vi.fn();
    const handleEditCart = vi.fn();

    render(
      <ReviewView
        customer={mockCustomer}
        items={mockPricedItems}
        totals={mockValidTotals}
        onEditCustomer={handleEditCustomer}
        onEditCart={handleEditCart}
      />
    );

    const editDetailsBtn = screen.getByRole('button', {
      name: /Edit Details/i,
    });
    fireEvent.click(editDetailsBtn);
    expect(handleEditCustomer).toHaveBeenCalledTimes(1);

    const editBasketBtn = screen.getByRole('button', {
      name: /Edit Basket/i,
    });
    fireEvent.click(editBasketBtn);
    expect(handleEditCart).toHaveBeenCalledTimes(1);
  });
});
