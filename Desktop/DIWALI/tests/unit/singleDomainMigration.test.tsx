import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Root } from '../../src/main';
import { handleApiRequest } from '../../src/server/api';
import { globalMemoryDb } from '../../src/server/db';

describe('Single Domain Migration: Storefront and Owner Portal Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalMemoryDb.seed();
    window.history.pushState({}, '', '/');
  });

  it('renders Customer Storefront on root path "/"', () => {
    window.history.pushState({}, '', '/');
    render(<Root />);

    expect(screen.getByText('NAGARJUNA TRADERS')).toBeInTheDocument();
    expect(screen.getAllByText(/Diwali Fireworks Catalogue/i).length).toBeGreaterThan(0);
  });

  it('renders Owner Administration Portal login on single-domain "/admin"', () => {
    window.history.pushState({}, '', '/admin');
    render(<Root />);

    expect(screen.getByText('Owner Administration Portal')).toBeInTheDocument();
    expect(screen.getByLabelText(/Owner Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Owner Portal/i })).toBeInTheDocument();
  });

  it('protects /api/admin and returns 401 for unauthenticated requests', async () => {
    const unauthReq = new Request('https://nagarjuna-traders.pages.dev/api/admin', {
      method: 'GET',
    });
    const res = await handleApiRequest(unauthReq);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('protects /api/v1/admin/dashboard and returns 401 for unauthenticated requests', async () => {
    const unauthReq = new Request('https://nagarjuna-traders.pages.dev/api/v1/admin/dashboard', {
      method: 'GET',
    });
    const res = await handleApiRequest(unauthReq);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });
});
