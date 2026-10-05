/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference types="@cloudflare/workers-types/2023-07-01" />
/// <reference path="../node_modules/@cloudflare/vitest-plugin/types/cloudflare-test.d.ts" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    ACTIVATION_SECRET?: string;
    ACTIVATION_ENCRYPTION_KEY?: string;
    TURNSTILE_SECRET_KEY?: string;
    ENVIRONMENT?: 'development' | 'staging' | 'production';
  }
}
