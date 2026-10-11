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

  const mockItems: CartItem[] = [
    {
      productId: 'cat1-sparklers-10cm',
      variantId: 'v-10cm-gold',
      productName: '10 cm Electric Sparklers',
      variantName: 'Gold 10cm',
      pricePaise: 4500,
      printedPriceText: '₹45',
      priceStatus: 'PRINTED_ESTIMATE',
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
    provisionalSubtotalPaise: 9000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer details, items, estimates, and statutory notice', () => {
    render(
      <ReviewView
        customer={mockCustomer}
        items={mockItems}
        totals={mockTotals}
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

    // Items info
    expect(
      screen.getByText(/10 cm Electric Sparklers \(Gold 10cm\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ground Chakkar \(Special 10 Pcs\)/i)
    ).toBeInTheDocument();

    // Totals & Statutory notice
    expect(screen.getByText(/Provisional Subtotal:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/₹90\.00/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Supreme Court E-Commerce & Licensing Notice/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/COMMERCE_CHECKOUT_ENABLED=false/i)
    ).toBeInTheDocument();
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
        items={mockItems}
        totals={mockTotals}
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

  it('copies enquiry summary to clipboard on click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ReviewView
        customer={mockCustomer}
        items={mockItems}
        totals={mockTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
      />
    );

    const copyBtn = screen.getByRole('button', {
      name: /Copy Enquiry Summary/i,
    });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText(/Summary Copied to Clipboard!/i)
      ).toBeInTheDocument();
    });
  });

  it('never renders live payment inputs, UPI ID fields, or order submission checkout forms', () => {
    render(
      <ReviewView
        customer={mockCustomer}
        items={mockItems}
        totals={mockTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
      />
    );

    // Verify absence of payment form elements
    expect(screen.queryByLabelText(/UPI ID/i)).toBeNull();
    expect(screen.queryByLabelText(/Card Number/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Pay Now/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /Place Order/i })).toBeNull();
  });

  it('navigates back to customer form or cart on edit button clicks', () => {
    const handleEditCustomer = vi.fn();
    const handleEditCart = vi.fn();

    render(
      <ReviewView
        customer={mockCustomer}
        items={mockItems}
        totals={mockTotals}
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
