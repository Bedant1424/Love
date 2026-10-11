import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminView } from '../../src/components/AdminView';
import { globalMemoryDb } from '../../src/server/db';

describe('Admin Operations Hub Component Tests', () => {
  const mockBackToCustomer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    globalMemoryDb.seed();
  });

  const loginToAdmin = async () => {
    render(<AdminView onBackToCustomerSite={mockBackToCustomer} />);
    const input = screen.getByLabelText(/Authorized Staff Passphrase/i);
    const submitBtn = screen.getByRole('button', { name: /Unlock Admin Console/i });
    fireEvent.change(input, { target: { value: 'nagarjuna-demo-2026' } });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Nagarjuna Traders Admin Panel')).toBeInTheDocument();
    });
  };

  it('renders and interacts with the Inventory & Stock tab', async () => {
    await loginToAdmin();

    const invTab = screen.getByRole('button', { name: /Inventory & Stock/i });
    fireEvent.click(invTab);

    await waitFor(() => {
      expect(screen.getByText(/Variant Inventory & Stock Levels/i)).toBeInTheDocument();
      expect(screen.getByText(/Inventory Movement Audit Log/i)).toBeInTheDocument();
    });

    // Test adjust stock button
    const adjustButtons = screen.getAllByRole('button', { name: /^Adjust$/i });
    expect(adjustButtons.length).toBeGreaterThan(0);
    fireEvent.click(adjustButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Adjust Stock Level/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/New Physical Stock Count/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Stock/i })).toBeInTheDocument();
    });
  });

  it('renders and interacts with QR Versions tab', async () => {
    await loginToAdmin();

    const qrTab = screen.getByRole('button', { name: /QR Versions/i });
    fireEvent.click(qrTab);

    await waitFor(() => {
      expect(screen.getByText(/UPI QR Code Management & Version Rotation/i)).toBeInTheDocument();
      expect(screen.getByText('CURRENTLY ACTIVE')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ Upload New QR Version/i })).toBeInTheDocument();
    });

    // Click upload QR modal
    fireEvent.click(screen.getByRole('button', { name: /\+ Upload New QR Version/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Upload New QR Version/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Upload Draft QR/i })).toBeInTheDocument();
    });
  });

  it('renders and interacts with Payment Issues tab', async () => {
    await loginToAdmin();

    const supportTab = screen.getByRole('button', { name: /Payment Issues/i });
    fireEvent.click(supportTab);

    await waitFor(() => {
      expect(screen.getByText(/Customer Payment Support Tickets/i)).toBeInTheDocument();
    });
  });

  it('renders Customer Directory and Sales Reports tabs', async () => {
    await loginToAdmin();

    // 1. Customer Directory tab
    const custTab = screen.getByRole('button', { name: /Customers/i });
    fireEvent.click(custTab);

    await waitFor(() => {
      expect(screen.getByText(/Customer Directory & Purchase History/i)).toBeInTheDocument();
    });

    // 2. Sales Reports tab
    const reportsTab = screen.getByRole('button', { name: /Sales Reports/i });
    fireEvent.click(reportsTab);

    await waitFor(() => {
      expect(screen.getByText(/Sales Analytics & RFC 4180 CSV Export/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Zero Hallucinated Revenue/i).length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /Download CSV/i })).toBeInTheDocument();
    });
  });
});
