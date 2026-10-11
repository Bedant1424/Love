import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../../src/App';

describe('App End-to-End Integration Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders initial Home page with store identity, portfolio demo badge, and category cards', () => {
    render(<App />);

    expect(screen.getByText('NAGARJUNA TRADERS')).toBeInTheDocument();
    expect(screen.getAllByText(/Portfolio Demo Mode/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        /Portfolio Demo Only\. No real orders, fireworks sales, delivery, or payments are processed\./i
      ).length
    ).toBeGreaterThan(0);

    // Verify 6 authentic category cards on home page
    expect(screen.getByText('Laddis')).toBeInTheDocument();
    expect(screen.getByText('Skyshots')).toBeInTheDocument();
    expect(screen.getByText('Bombs')).toBeInTheDocument();
    expect(screen.getByText('Jharjhari & Sparklers')).toBeInTheDocument();
    expect(screen.getByText('Kumpi & Chakri')).toBeInTheDocument();
    expect(screen.getByText('Others')).toBeInTheDocument();
  });

  it('allows full customer journey: Home -> Catalogue -> Add Items (>= ₹100) -> Basket -> Customer Form -> Simulated Payment -> Demo Order Confirmation', async () => {
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

    // Increment quantity to 2 so subtotal = ₹120 (>= ₹100 minimum demo requirement)
    const increaseBtn = screen.getByRole('button', {
      name: /Increase quantity/i,
    });
    fireEvent.click(increaseBtn);

    // 3. Open Basket via the sticky bar
    const viewBasketBtn = screen.getByText(/Review Box/i);
    fireEvent.click(viewBasketBtn);

    // Verify we are in CartView
    expect(screen.getByText('Demo Basket')).toBeInTheDocument();
    expect(
      screen.getByText(/Demo Financial Breakdown/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Fixed Demo Token')).toBeInTheDocument();

    // 4. Click Proceed to Review & Summary
    // Since customer details are empty, it should navigate to Customer Form first
    const proceedBtn = screen.getByRole('button', {
      name: /Proceed to Review & Summary/i,
    });
    fireEvent.click(proceedBtn);

    // Verify we are on Customer Information page
    expect(screen.getByText('Sample Customer Information')).toBeInTheDocument();

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
    expect(screen.getByText('Simulated Checkout & Review')).toBeInTheDocument();
    expect(screen.getByText('Kalyan Varma')).toBeInTheDocument();
    expect(screen.getByText('+91 9848022338')).toBeInTheDocument();
    expect(screen.getAllByText(/₹120\.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₹100\.00/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₹20\.00/i).length).toBeGreaterThan(0);

    // 7. Proceed to Simulated Payment
    const simulatedPayBtn = screen.getByRole('button', {
      name: /Proceed to Simulated Payment/i,
    });
    fireEvent.click(simulatedPayBtn);

    // Modal opens in pending state
    expect(
      screen.getByText(/Fixed ₹100 Demo Token Payment/i)
    ).toBeInTheDocument();

    // Simulate success
    const simulateSuccessBtn = screen.getByRole('button', {
      name: /Simulate Successful Payment \(Test Success\)/i,
    });
    fireEvent.click(simulateSuccessBtn);

    // 8. Order confirmation state reached
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

    // Verify that live commerce checkout is NEVER rendered
    expect(screen.queryByLabelText(/Card Number/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /^Pay Now$/i })).toBeNull();
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
      name: /Demo Basket \(3\)/i,
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
