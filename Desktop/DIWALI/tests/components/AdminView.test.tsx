import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminView } from '../../src/components/AdminView';
import { globalMemoryDb } from '../../src/server/db';

describe('AdminView Component Suite', () => {
  const mockBackToCustomer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalMemoryDb.seed();
  });

  it('renders Access Not Authorised prompt initially and prevents unauthorized access', () => {
    render(<AdminView onBackToCustomerSite={mockBackToCustomer} />);

    expect(screen.getByText('Access Not Authorised')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Retry \/ Re-authenticate/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Authorized Staff Passphrase/i)).toBeInTheDocument();
  });

  it('shows error on invalid passphrase and unlocks on correct passphrase', async () => {
    render(<AdminView onBackToCustomerSite={mockBackToCustomer} />);

    const input = screen.getByLabelText(/Authorized Staff Passphrase/i);
    const submitBtn = screen.getByRole('button', { name: /Unlock Admin Console/i });

    // 1. Invalid passphrase
    fireEvent.change(input, { target: { value: 'wrong-passphrase' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid passphrase/i)).toBeInTheDocument();
    });

    // 2. Correct passphrase
    fireEvent.change(input, { target: { value: 'admin' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Nagarjuna Traders Admin Panel')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Overview & KPIs/i })).toBeInTheDocument();
    });
  });

  it('renders KPI cards and allows navigating between admin tabs', async () => {
    render(<AdminView onBackToCustomerSite={mockBackToCustomer} />);

    // Login
    fireEvent.change(screen.getByLabelText(/Authorized Staff Passphrase/i), {
      target: { value: 'admin' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Unlock Admin Console/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Overview & KPIs/i })).toBeInTheDocument();
      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('UTR Submitted (Unverified)')).toBeInTheDocument();
    });

    // Navigate to Catalogue & Pricing tab
    const catTab = screen.getByRole('button', { name: /Catalogue & Pricing/i });
    fireEvent.click(catTab);

    await waitFor(() => {
      expect(
        screen.getByText(/Diwali Poster Inventory & Pricing/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Total Variants:/i)).toBeInTheDocument();
    });

    // Navigate to Audit Logs tab
    const auditTab = screen.getByRole('button', { name: /Audit Logs/i });
    fireEvent.click(auditTab);

    await waitFor(() => {
      expect(screen.getByText('Immutable Audit Stream')).toBeInTheDocument();
    });
  });

  it('allows editing a price within printed bounds', async () => {
    render(<AdminView onBackToCustomerSite={mockBackToCustomer} />);

    // Login
    fireEvent.change(screen.getByLabelText(/Authorized Staff Passphrase/i), {
      target: { value: 'admin' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Unlock Admin Console/i }));

    await waitFor(() => {
      expect(screen.getByText('Nagarjuna Traders Admin Panel')).toBeInTheDocument();
    });

    // Switch to Catalogue tab
    fireEvent.click(screen.getByRole('button', { name: /Catalogue & Pricing/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Edit Price/i }).length).toBeGreaterThan(0);
    });

    // Click edit on the first item
    const editButtons = screen.getAllByRole('button', { name: /Edit Price/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Edit Price/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Price/i })).toBeInTheDocument();
    });
  });
});
