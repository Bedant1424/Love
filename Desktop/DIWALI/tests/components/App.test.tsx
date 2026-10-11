import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { apiClient } from '../../src/services/apiClient';

describe('App End-to-End Integration Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders initial Home page with authentic store identity and 6 category cards without demo badges', () => {
    render(<App />);

    expect(screen.getByText('NAGARJUNA TRADERS')).toBeInTheDocument();
    expect(screen.getByText(/Counter Pickup Only/i)).toBeInTheDocument();

    // Verify 6 authentic category cards on home page
    expect(screen.getByText('Laddis')).toBeInTheDocument();
    expect(screen.getByText('Skyshots')).toBeInTheDocument();
    expect(screen.getByText('Bombs')).toBeInTheDocument();
    expect(screen.getByText('Jharjhari & Sparklers')).toBeInTheDocument();
    expect(screen.getByText('Kumpi & Chakri')).toBeInTheDocument();
    expect(screen.getByText('Others')).toBeInTheDocument();
  });

  it('allows full customer journey: Home -> Catalogue -> Add Items -> Cart -> Customer Form -> Review -> QR -> UTR -> Confirmation', async () => {
    vi.spyOn(apiClient, 'createOrder').mockResolvedValueOnce({
      orderReference: 'NT-9001',
      accessToken: 'token-uuid-9001',
      operationalStatus: 'SUBMITTED',
      paymentStatus: 'UNPAID',
      subtotalPaise: 12000,
      tokenDuePaise: 5000, // ₹50 token for ₹120 subtotal (< ₹200)
      balanceDuePaise: 7000,
      paymentInstructions: {
        vpa: 'test-fixture@nagarjunatraders',
        accountName: 'NAGARJUNA TRADERS (TEST)',
        amountInr: '50.00',
        transactionNote: 'NT-9001',
        paymentCollectionEnabled: false,
        notice: 'Test fixture only.',
      },
    });

    vi.spyOn(apiClient, 'submitUtr').mockResolvedValueOnce({
      orderReference: 'NT-9001',
      paymentReference: '428911223344',
      paymentStatus: 'RECORDED_UNVERIFIED',
      message: 'Recorded unverified',
    });

    render(<App />);

    // 1. Click "Browse 2026 Catalogue" from Home
    const browseBtn = screen.getByRole('button', {
      name: /Browse 2026 Catalogue/i,
    });
    fireEvent.click(browseBtn);

    // Should now be on Catalogue tab showing product listing
    expect(screen.getByText('All Fireworks Products')).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /All Categories \(6\)/i })
    ).toBeInTheDocument();

    // 2. Add first available product (Bijli Laddi: ₹60)
    const addButtons = screen.getAllByRole('button', {
      name: /to enquiry basket/i,
    });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    // Sticky Cart bar should appear on mobile viewport
    expect(screen.getByText(/Review Box/i)).toBeInTheDocument();

    // Increment quantity to 2 so subtotal = ₹120
    const increaseBtn = screen.getByRole('button', {
      name: /Increase quantity/i,
    });
    fireEvent.click(increaseBtn);

    // 3. Open Cart via the sticky bar
    const viewCartBtn = screen.getByText(/Review Box/i);
    fireEvent.click(viewCartBtn);

    // Verify we are in CartView
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(
      screen.getByText(/Order Price & Advance Token Breakdown/i)
    ).toBeInTheDocument();

    // 4. Click Proceed to Review & Pay
    // Since customer details are empty, it should navigate to Customer Form first
    const proceedBtn = screen.getByRole('button', {
      name: /Proceed to Review & Pay/i,
    });
    fireEvent.click(proceedBtn);

    // Verify we are on Customer Information page
    expect(screen.getByText('Customer Information')).toBeInTheDocument();

    // 5. Fill customer form
    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Kalyan Varma' },
    });
    fireEvent.change(screen.getByLabelText(/10-Digit Mobile Number/i), {
      target: { value: '9848022338' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    // Submit customer form
    const saveAndContinueBtn = screen.getByRole('button', {
      name: /Save & Continue to Review/i,
    });
    fireEvent.click(saveAndContinueBtn);

    // 6. Should now be in ReviewView (Step 6)
    expect(screen.getByText('Order Review & Advance Token')).toBeInTheDocument();
    expect(screen.getByText('Kalyan Varma')).toBeInTheDocument();
    expect(screen.getByText('+91 9848022338')).toBeInTheDocument();
    expect(screen.getAllByText(/₹120\.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₹50\.00/i).length).toBeGreaterThan(0); // ₹50 token for ₹120

    // 7. Proceed to QR Payment Instructions (Step 7)
    const proceedToQrBtn = screen.getByRole('button', {
      name: /Proceed to QR Payment Instructions/i,
    });
    fireEvent.click(proceedToQrBtn);

    await waitFor(() => {
      expect(screen.getByText(/UPI QR Payment Instructions/i)).toBeInTheDocument();
      expect(screen.getByText('NT-9001')).toBeInTheDocument();
    });

    // 8. Proceed to enter 12-digit UTR (Step 8)
    const enterUtrBtn = screen.getByRole('button', {
      name: /I Have Paid \/ Enter 12-Digit UTR/i,
    });
    fireEvent.click(enterUtrBtn);

    expect(screen.getByText(/Submit 12-Digit UTR/i)).toBeInTheDocument();
    const utrInput = screen.getByLabelText(/12-Digit UPI Transaction Reference/i);
    fireEvent.change(utrInput, { target: { value: '428911223344' } });

    const submitUtrBtn = screen.getByRole('button', {
      name: /Submit UTR Reference/i,
    });
    fireEvent.click(submitUtrBtn);

    // 9. Order Confirmation (Step 9)
    await waitFor(() => {
      expect(
        screen.getByText(/Order Reserved Successfully/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Order Reference: NT-9001/i)).toBeInTheDocument();
      expect(screen.getByText(/RECORDED_UNVERIFIED/i)).toBeInTheDocument();
    });

    // Verify live commerce checkout forms are never rendered
    expect(screen.queryByLabelText(/Card Number/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Pay Now$/i })).toBeNull();
  });

  it('restores cart items from localStorage on initial render', () => {
    localStorage.setItem(
      'nt_cart_items_v1',
      JSON.stringify([
        {
          productId: 'prod_bijli_laddi',
          variantId: 'var_bijli_60',
          quantity: 3,
        },
      ])
    );

    render(<App />);

    const cartNavBtn = screen.getByRole('button', {
      name: /Shopping Cart \(3\)/i,
    });
    expect(cartNavBtn).toBeInTheDocument();

    fireEvent.click(cartNavBtn);

    expect(screen.getByText('Bijli Laddi')).toBeInTheDocument();
    expect(
      screen.getByText('3 items selected across 1 product(s)')
    ).toBeInTheDocument();
  });
});
