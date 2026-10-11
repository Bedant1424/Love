import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';

describe('App End-to-End Integration Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders initial Home page with store identity and category cards', () => {
    render(<App />);

    expect(screen.getByText('NAGARJUNA TRADERS')).toBeInTheDocument();
    expect(screen.getByText('Enquiry Mode Active')).toBeInTheDocument();
    expect(
      screen.getByText(/Light Up Your Festivities with Authentic Crackers/i)
    ).toBeInTheDocument();

    // Verify 6 authentic category cards on home page
    expect(screen.getByText('Laddis')).toBeInTheDocument();
    expect(screen.getByText('Skyshots')).toBeInTheDocument();
    expect(screen.getByText('Bombs')).toBeInTheDocument();
    expect(screen.getByText('Jharjhari & Sparklers')).toBeInTheDocument();
    expect(screen.getByText('Kumpi & Chakri')).toBeInTheDocument();
    expect(screen.getByText('Others')).toBeInTheDocument();
  });

  it('allows full customer journey: Home -> Catalogue -> Add Item -> Basket -> Customer Form -> Review', async () => {
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

    // 2. Add first available product (Bijli Laddi)
    const addButtons = screen.getAllByRole('button', {
      name: /to enquiry basket/i,
    });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    // Sticky Cart bar should appear on mobile viewport
    expect(screen.getByText(/Review Box/i)).toBeInTheDocument();

    // 3. Open Basket via the sticky bar
    const viewBasketBtn = screen.getByText(/Review Box/i);
    fireEvent.click(viewBasketBtn);

    // Verify we are in CartView
    expect(screen.getByText('Enquiry Basket')).toBeInTheDocument();
    expect(
      screen.getByText(/Provisional Estimate Summary/i)
    ).toBeInTheDocument();

    // 4. Click Proceed to Review & Summary
    // Since customer details are empty, it should navigate to Customer Form first
    const proceedBtn = screen.getByRole('button', {
      name: /Proceed to Review & Summary/i,
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

    // 6. Should now be in ReviewView
    expect(screen.getByText('Enquiry Review & Estimate')).toBeInTheDocument();
    expect(screen.getByText('Kalyan Varma')).toBeInTheDocument();
    expect(screen.getByText('+91 9848022338')).toBeInTheDocument();
    expect(
      screen.getByText(/Supreme Court E-Commerce & Licensing Notice/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Copy Enquiry Summary/i })
    ).toBeInTheDocument();

    // Verify that checkout is NEVER rendered
    expect(screen.queryByText(/Pay Now/i)).toBeNull();
    expect(screen.queryByText(/Place Order/i)).toBeNull();
  });

  it('restores cart items from localStorage on initial render', () => {
    // Seed localStorage with authentic product ID and variant from catalogueData
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

    // Header navigation button reflects 3 items
    const cartNavBtn = screen.getByRole('button', {
      name: /Enquiry Basket \(3\)/i,
    });
    expect(cartNavBtn).toBeInTheDocument();

    // Navigate to cart
    fireEvent.click(cartNavBtn);

    expect(screen.getByText('Bijli Laddi')).toBeInTheDocument();
    expect(
      screen.getByText('3 items selected across 1 product(s)')
    ).toBeInTheDocument();
  });
});
