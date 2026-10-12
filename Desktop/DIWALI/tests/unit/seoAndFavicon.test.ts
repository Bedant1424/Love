import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SEO Metadata, Favicon, and Em Dash Verification Suite', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

  it('verifies exact title and meta description in index.html', () => {
    expect(indexHtml).toContain('<title>Nagarjuna Traders | Diwali Firecrackers Catalogue</title>');
    expect(indexHtml).toContain(
      '<meta\n      name="description"\n      content="Browse the Nagarjuna Traders Diwali firecrackers catalogue, compare sizes and prices, and place your order online for pickup."\n    />'
    );
  });

  it('verifies canonical URL and theme color in index.html', () => {
    expect(indexHtml).toContain('<link rel="canonical" href="https://nagarjuna-traders.pages.dev/" />');
    expect(indexHtml).toContain('<meta name="theme-color" content="#EA580C" />');
  });

  it('verifies Open Graph and Twitter card metadata in index.html', () => {
    expect(indexHtml).toContain('<meta property="og:title" content="Nagarjuna Traders | Diwali Firecrackers Catalogue" />');
    expect(indexHtml).toContain(
      '<meta\n      property="og:description"\n      content="Browse the Nagarjuna Traders Diwali firecrackers catalogue, compare sizes and prices, and place your order online for pickup."\n    />'
    );
    expect(indexHtml).toContain('<meta property="og:url" content="https://nagarjuna-traders.pages.dev/" />');
    expect(indexHtml).toContain('<meta property="og:site_name" content="Nagarjuna Traders" />');
    expect(indexHtml).toContain('<meta property="og:type" content="website" />');
    expect(indexHtml).toContain('<meta property="og:image" content="https://nagarjuna-traders.pages.dev/images/hero-diwali.jpg" />');

    expect(indexHtml).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(indexHtml).toContain('<meta name="twitter:title" content="Nagarjuna Traders | Diwali Firecrackers Catalogue" />');
    expect(indexHtml).toContain('<meta name="twitter:image" content="https://nagarjuna-traders.pages.dev/images/hero-diwali.jpg" />');
  });

  it('verifies favicon links and webmanifest reference in index.html', () => {
    expect(indexHtml).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
    expect(indexHtml).toContain('<link rel="alternate icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />');
    expect(indexHtml).toContain('<link rel="apple-touch-icon" href="/favicon-192x192.png" />');
    expect(indexHtml).toContain('<link rel="manifest" href="/site.webmanifest" />');
  });

  it('verifies public/favicon.svg exists and contains NT monogram and flame symbol', () => {
    const faviconPath = path.join(rootDir, 'public/favicon.svg');
    expect(fs.existsSync(faviconPath)).toBe(true);
    const svgContent = fs.readFileSync(faviconPath, 'utf8');
    expect(svgContent).toContain('NT');
    expect(svgContent).toContain('<path');
  });

  it('verifies public/robots.txt disallows /admin and references sitemap.xml', () => {
    const robotsPath = path.join(rootDir, 'public/robots.txt');
    expect(fs.existsSync(robotsPath)).toBe(true);
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    expect(robotsContent).toContain('Disallow: /admin');
    expect(robotsContent).toContain('Disallow: /api/');
    expect(robotsContent).toContain('Sitemap: https://nagarjuna-traders.pages.dev/sitemap.xml');
  });

  it('verifies public/sitemap.xml contains production URL and excludes admin', () => {
    const sitemapPath = path.join(rootDir, 'public/sitemap.xml');
    expect(fs.existsSync(sitemapPath)).toBe(true);
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    expect(sitemapContent).toContain('https://nagarjuna-traders.pages.dev/');
    expect(sitemapContent).not.toContain('/admin');
  });

  it('verifies public/_headers sets X-Robots-Tag noindex for /admin*', () => {
    const headersPath = path.join(rootDir, 'public/_headers');
    expect(fs.existsSync(headersPath)).toBe(true);
    const headersContent = fs.readFileSync(headersPath, 'utf8');
    expect(headersContent).toContain('X-Robots-Tag: noindex, nofollow');
  });

  it('ensures zero em dash (U+2014) characters in index.html, source files, and docs', () => {
    const scanPaths = ['index.html', 'src', 'docs'];
    let emDashFound = 0;

    function checkDirOrFile(target: string) {
      const full = path.join(rootDir, target);
      if (!fs.existsSync(full)) return;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        for (const f of fs.readdirSync(full)) {
          checkDirOrFile(path.join(target, f));
        }
      } else if (stat.isFile() && (target.endsWith('.html') || target.endsWith('.ts') || target.endsWith('.tsx') || target.endsWith('.md'))) {
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes('\u2014')) {
          emDashFound++;
          console.error(`Em dash found in ${target}`);
        }
      }
    }

    for (const p of scanPaths) {
      checkDirOrFile(p);
    }

    expect(emDashFound).toBe(0);
  });
});
