import type { Context } from 'hono';
import type { Env, RedirectCardRecord, RedirectResolution } from './types';
import { validatePublicId, createErrorResponse } from '../shared/utils';

/**
 * Common security & privacy headers applied to all redirect engine responses.
 */
export function applyRedirectHeaders(c: Context<{ Bindings: Env }>): void {
  c.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  c.header('Referrer-Policy', 'no-referrer');
}

/**
 * Resolves the destination or terminal state for a card public ID.
 * Invariant: Executes at most ONE indexed D1 lookup (status, destination_url).
 * Never mutates D1 state. Never makes external HTTP requests.
 */
export async function resolveRedirect(db: Env['DB'], rawId: unknown): Promise<RedirectResolution> {
  const validation = validatePublicId(rawId);
  if (!validation.isValid || !validation.normalizedId) {
    return { type: 'INVALID_ID' };
  }

  const publicId = validation.normalizedId;

  try {
    const row = await db
      .prepare('SELECT status, destination_url FROM cards WHERE public_id = ?')
      .bind(publicId)
      .first<RedirectCardRecord>();

    if (!row) {
      return { type: 'NOT_FOUND' };
    }

    switch (row.status) {
      case 'ACTIVE':
        if (!row.destination_url) {
          return { type: 'SERVER_ERROR' };
        }
        return { type: 'ACTIVE', destinationUrl: row.destination_url };

      case 'UNACTIVATED':
        return { type: 'UNACTIVATED', publicId };

      case 'DISABLED':
        return { type: 'DISABLED' };

      case 'RETIRED':
        return { type: 'RETIRED' };

      default:
        return { type: 'NOT_FOUND' };
    }
  } catch {
    console.error('[Redirect Engine] Internal database lookup error');
    return { type: 'SERVER_ERROR' };
  }
}

/**
 * Minimalist Swiss Design standalone HTML status page.
 * Mobile-first, WCAG AAA contrast, zero external dependencies.
 */
export function renderStatusHtml(options: {
  title: string;
  badgeText: string;
  badgeStyle?: 'neutral' | 'amber' | 'red';
  heading: string;
  description: string;
}): string {
  const { title, badgeText, badgeStyle = 'neutral', heading, description } = options;

  let badgeBg = '#f4f4f5';
  let badgeColor = '#52525b';
  let badgeBorder = '#e4e4e7';

  if (badgeStyle === 'amber') {
    badgeBg = '#fffbeb';
    badgeColor = '#b45309';
    badgeBorder = '#fef3c7';
  } else if (badgeStyle === 'red') {
    badgeBg = '#fef2f2';
    badgeColor = '#b91c1c';
    badgeBorder = '#fee2e2';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — QRoute</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #fafafa;
      color: #09090b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      width: 100%;
      max-width: 440px;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      background-color: ${badgeBg};
      color: ${badgeColor};
      border: 1px solid ${badgeBorder};
      margin-bottom: 1.25rem;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #09090b;
      margin-bottom: 0.75rem;
      line-height: 1.3;
    }
    p {
      font-size: 0.9375rem;
      line-height: 1.5;
      color: #52525b;
    }
    .footer {
      margin-top: 1.75rem;
      padding-top: 1rem;
      border-top: 1px solid #f4f4f5;
      font-size: 0.75rem;
      color: #71717a;
    }
  </style>
</head>
<body>
  <main class="container">
    <div class="badge">${badgeText}</div>
    <h1>${heading}</h1>
    <p>${description}</p>
    <div class="footer">QRoute &bull; Secure Edge Routing</div>
  </main>
</body>
</html>`;
}

/**
 * Handles incoming GET /c/:publicId redirect request.
 */
export async function handleRedirectRequest(
  c: Context<{ Bindings: Env }>,
  isHeadRequest: boolean = false
): Promise<Response> {
  applyRedirectHeaders(c);

  const rawId = c.req.param('publicId');
  const resolution = await resolveRedirect(c.env.DB, rawId);

  const isJsonClient =
    c.req.header('Accept')?.includes('application/json') &&
    !c.req.header('Accept')?.includes('text/html');

  switch (resolution.type) {
    case 'ACTIVE': {
      // 302 Found redirect to Google Review URL
      if (isHeadRequest) {
        c.header('Location', resolution.destinationUrl);
        return c.body(null, 302);
      }
      return c.redirect(resolution.destinationUrl, 302);
    }

    case 'UNACTIVATED': {
      // 302 Found redirect to activation shell
      const activationUrl = `/activate/${resolution.publicId}`;
      if (isHeadRequest) {
        c.header('Location', activationUrl);
        return c.body(null, 302);
      }
      return c.redirect(activationUrl, 302);
    }

    case 'DISABLED': {
      if (isHeadRequest) {
        return c.body(null, 200);
      }
      if (isJsonClient) {
        return c.json(
          {
            success: true,
            status: 'DISABLED',
            message: 'This review card is temporarily inactive. Please check back later.',
          },
          200
        );
      }
      const html = renderStatusHtml({
        title: 'Card Inactive',
        badgeText: 'Temporarily Inactive',
        badgeStyle: 'amber',
        heading: 'Review Card Temporarily Inactive',
        description: 'This review card is temporarily inactive. Please check back later.',
      });
      return c.html(html, 200);
    }

    case 'RETIRED': {
      if (isHeadRequest) {
        return c.body(null, 200);
      }
      if (isJsonClient) {
        return c.json(
          {
            success: true,
            status: 'RETIRED',
            message: 'This card has been retired from service.',
          },
          200
        );
      }
      const html = renderStatusHtml({
        title: 'Card Retired',
        badgeText: 'Retired Card',
        badgeStyle: 'red',
        heading: 'Card Retired',
        description: 'This card has been retired from service.',
      });
      return c.html(html, 200);
    }

    case 'INVALID_ID':
    case 'NOT_FOUND': {
      if (isHeadRequest) {
        return c.body(null, 404);
      }
      if (isJsonClient) {
        return c.json(
          createErrorResponse(
            'NOT_FOUND',
            'Card not found. Please verify that you scanned an official review card.'
          ),
          404
        );
      }
      const html = renderStatusHtml({
        title: 'Card Not Found',
        badgeText: '404 Not Found',
        badgeStyle: 'neutral',
        heading: 'Card Not Found',
        description: 'Card not found. Please verify that you scanned an official review card.',
      });
      return c.html(html, 404);
    }

    case 'SERVER_ERROR':
    default: {
      if (isHeadRequest) {
        return c.body(null, 500);
      }
      if (isJsonClient) {
        return c.json(
          createErrorResponse('SERVER_ERROR', 'The request could not be processed.'),
          500
        );
      }
      const html = renderStatusHtml({
        title: 'Service Unavailable',
        badgeText: 'System Alert',
        badgeStyle: 'red',
        heading: 'Service Temporarily Unavailable',
        description: 'The request could not be processed. Please try again shortly.',
      });
      return c.html(html, 500);
    }
  }
}
