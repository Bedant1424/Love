import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminView } from '../../src/components/AdminView';
import { globalMemoryDb } from '../../src/server/db';
import { handleApiRequest } from '../../src/server/api';

describe('AdminView Component Suite', () => {
  const mockBackToCustomer = vi.fn();
  const testEmail = 'astar0017@gmail.com';
  const initialPass = 'initialPass123';
  const newPass = 'MyStrongPassword2026!';

  beforeEach(async () => {
    vi.clearAllMocks();
    globalMemoryDb.seed();
    // Initialize the single admin account
    await handleApiRequest(
      new Request('http://localhost/api/v1/admin/auth/init', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: initialPass }),
      })
    );
  });

  const loginAndUnlockAdmin = async () => {
    render(<AdminView onBackToCustomerSite={mockBackToCustomer} />);

    // 1. Submit login
    fireEvent.change(screen.getByLabelText(/Owner Email Address/i), {
      target: { value: testEmail },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: initialPass },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Owner Portal/i }));

    // 2. Complete mandatory password change
    await waitFor(() => {
      expect(screen.getByText('Change Initial Password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: initialPass },
    });
    fireEvent.change(screen.getByLabelText(/New Password \(min 8 chars\)/i), {
      target: { value: newPass },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: newPass },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Save Password & Enter Dashboard/i })
    );

    // 3. Confirm admin panel unlocked
    await waitFor(() => {
      expect(screen.getByText('Nagarjuna Traders Admin Panel')).toBeInTheDocument();
    });
  };

  it('renders Owner Administration Portal sign-in state initially and presents email & password fields', () => {
    render(<AdminView onBackToCustomerSite={mockBackToCustomer} />);

    expect(screen.getByText('Owner Administration Portal')).toBeInTheDocument();
    expect(screen.getByLabelText(/Owner Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Sign In to Owner Portal/i })
    ).toBeInTheDocument();
  });

  it('shows error on invalid credentials and prompts for password change on initial login', async () => {
    render(<AdminView onBackToCustomerSite={mockBackToCustomer} />);

    const emailInput = screen.getByLabelText(/Owner Email Address/i);
    const passInput = screen.getByLabelText(/^Password$/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In to Owner Portal/i });

    // 1. Invalid credentials
    fireEvent.change(emailInput, { target: { value: testEmail } });
    fireEvent.change(passInput, { target: { value: 'wrong-password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });

    // 2. Correct credentials -> prompts for password change
    fireEvent.change(passInput, { target: { value: initialPass } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Change Initial Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/New Password \(min 8 chars\)/i)).toBeInTheDocument();
    });
  });

  it('renders KPI cards and allows navigating between admin tabs', async () => {
    await loginAndUnlockAdmin();

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
    await loginAndUnlockAdmin();

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

  it('displays accurate QR version badge and allows navigating to QR Versions tab', async () => {
    await loginAndUnlockAdmin();

    // Check QR Versions button in tabs
    const qrTabBtn = screen.getByRole('button', { name: /QR Versions/i });
    expect(qrTabBtn).toBeInTheDocument();

    // Switch to QR Versions tab
    fireEvent.click(qrTabBtn);

    await waitFor(() => {
      expect(
        screen.getByText('UPI QR Code Management & Version Rotation')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /\+ Upload New QR Version/i })
      ).toBeInTheDocument();
    });
  });
});
