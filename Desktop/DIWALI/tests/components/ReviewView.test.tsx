import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReviewView } from '../../src/components/ReviewView';
import { CartItem, CartTotals } from '../../src/types/cart';
import { CustomerDetails } from '../../src/types/customer';
import { apiClient } from '../../src/services/apiClient';

describe('ReviewView Component (Screens 6 to 10)', () => {
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
    tokenAmountPaise: 10000, // ₹100 tier for ₹360 subtotal
    remainingBalancePaise: 26000, // ₹360 - ₹100 = ₹260
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
      'Every item in your box must have a confirmed price before proceeding to payment instructions.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(apiClient, 'getPaymentConfig').mockResolvedValue({
      paymentCollectionEnabled: false,
      isRestrictedEnv: true,
      vpa: 'test-fixture@nagarjunatraders',
      accountName: 'NAGARJUNA TRADERS (TEST)',
      message: 'Restricted testing environment: non-payable test QR fixture active.',
    });
  });

  it('renders customer details, items, financial breakdown with tiered token', async () => {
    render(
      <ReviewView
        customer={mockCustomer}
        items={mockPricedItems}
        totals={mockValidTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Ramesh Patel')).toBeInTheDocument();
    });
    expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
    expect(screen.getByText(/Counter Pickup/i)).toBeInTheDocument();
    expect(screen.getByText(/18\+ Confirmed/i)).toBeInTheDocument();

    // Item info
    expect(
      screen.getByText(/10 cm Electric Sparklers \(Gold 10cm\)/i)
    ).toBeInTheDocument();

    // Financial breakdown with ₹100 token
    expect(screen.getAllByText(/₹360\.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₹100\.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₹260\.00/i).length).toBeGreaterThan(0);
  });

  it('shows truthful unavailable notice and blocks payment when public payment is disabled and not restricted', async () => {
    vi.spyOn(apiClient, 'getPaymentConfig').mockResolvedValueOnce({
      paymentCollectionEnabled: false,
      isRestrictedEnv: false,
      vpa: null,
      accountName: null,
      message: 'Payment instructions are currently unavailable.',
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

    await waitFor(() => {
      expect(
        screen.getByText(/Payment instructions are currently unavailable/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /Proceed to QR Payment Instructions/i })
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Copy Order Summary/i })
    ).toBeInTheDocument();
  });

  it('advances from Screen 6 (Review) -> Screen 7 (QR) -> Screen 8 (UTR) -> Screen 9 (Confirmation)', async () => {
    vi.spyOn(apiClient, 'createOrder').mockResolvedValueOnce({
      orderReference: 'NT-8821',
      accessToken: 'token-uuid-1234',
      operationalStatus: 'SUBMITTED',
      paymentStatus: 'UNPAID',
      subtotalPaise: 36000,
      tokenDuePaise: 10000,
      balanceDuePaise: 26000,
      paymentInstructions: {
        vpa: 'test-fixture@nagarjunatraders',
        accountName: 'NAGARJUNA TRADERS (TEST)',
        amountInr: '100.00',
        transactionNote: 'NT-8821',
        paymentCollectionEnabled: false,
        notice: 'Test fixture only.',
      },
    });

    vi.spyOn(apiClient, 'submitUtr').mockResolvedValueOnce({
      orderReference: 'NT-8821',
      paymentReference: '428912345678',
      paymentStatus: 'RECORDED_UNVERIFIED',
      message: 'Recorded unverified',
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

    // Step 6: Wait for proceed button in restricted env and click
    const proceedBtn = await screen.findByRole('button', {
      name: /Proceed to QR Payment Instructions/i,
    });
    fireEvent.click(proceedBtn);

    // Step 7: QR instructions screen
    await waitFor(() => {
      expect(
        screen.getByText(/UPI QR Payment Instructions/i)
      ).toBeInTheDocument();
      expect(screen.getByText('NT-8821')).toBeInTheDocument();
      expect(screen.getByText(/NON-PAYABLE FIXTURE/i)).toBeInTheDocument();
    });

    // Click to enter UTR
    const enterUtrBtn = screen.getByRole('button', {
      name: /I Have Paid \/ Enter 12-Digit UTR/i,
    });
    fireEvent.click(enterUtrBtn);

    // Step 8: UTR submission screen
    expect(screen.getByText(/Submit 12-Digit UTR/i)).toBeInTheDocument();
    const utrInput = screen.getByLabelText(/12-Digit UPI Transaction Reference/i);

    // Enter 12 digits
    fireEvent.change(utrInput, { target: { value: '428912345678' } });

    const submitUtrBtn = screen.getByRole('button', {
      name: /Submit UTR Reference/i,
    });
    fireEvent.click(submitUtrBtn);

    // Step 9: Confirmation screen
    await waitFor(() => {
      expect(
        screen.getByText(/Order Details Recorded/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/RECORDED_UNVERIFIED/i)).toBeInTheDocument();
      expect(screen.getByText('428912345678')).toBeInTheDocument();
    });
  });

  it('navigates to Screen 10 (Order Status Tracker) and shows progress', async () => {
    vi.spyOn(apiClient, 'createOrder').mockResolvedValueOnce({
      orderReference: 'NT-5500',
      accessToken: 'token-uuid-5500',
      operationalStatus: 'SUBMITTED',
      paymentStatus: 'UNPAID',
      subtotalPaise: 36000,
      tokenDuePaise: 10000,
      balanceDuePaise: 26000,
      paymentInstructions: {
        vpa: 'test-fixture@nagarjunatraders',
        accountName: 'NAGARJUNA TRADERS (TEST)',
        amountInr: '100.00',
        transactionNote: 'NT-5500',
        paymentCollectionEnabled: false,
        notice: 'Test fixture only.',
      },
    });

    vi.spyOn(apiClient, 'submitUtr').mockResolvedValueOnce({
      orderReference: 'NT-5500',
      paymentReference: '428999887766',
      paymentStatus: 'RECORDED_UNVERIFIED',
      message: 'Recorded unverified',
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

    const proceedBtn = await screen.findByRole('button', {
      name: /Proceed to QR Payment Instructions/i,
    });
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/NT-5500/i).length).toBeGreaterThan(0);
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /I Have Paid \/ Enter 12-Digit UTR/i,
      })
    );

    const utrInput = screen.getByLabelText(/12-Digit UPI Transaction Reference/i);
    fireEvent.change(utrInput, { target: { value: '428999887766' } });
    fireEvent.click(
      screen.getByRole('button', { name: /Submit UTR Reference/i })
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Track Live Order Status/i })
      ).toBeInTheDocument();
    });

    // Click Track Live Order Status -> Enters Screen 10
    fireEvent.click(
      screen.getByRole('button', { name: /Track Live Order Status/i })
    );

    expect(screen.getByText(/Order Status Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/Fulfilment Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/Order Collection Information/i)).toBeInTheDocument();
  });

  it('disables proceed action when unpriced items exist', async () => {
    render(
      <ReviewView
        customer={mockCustomer}
        items={mockPricedItems}
        totals={mockUnpricedTotals}
        onEditCustomer={vi.fn()}
        onEditCart={vi.fn()}
      />
    );

    const proceedBtn = await screen.findByRole('button', {
      name: /Proceed to QR Payment Instructions/i,
    });
    expect(proceedBtn).toBeDisabled();
  });
});
