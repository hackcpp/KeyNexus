import { test as base, expect, type Page } from '@playwright/test'

/** Mock user data matching Supabase User structure */
const MOCK_USER = {
  id: 'test-user-id-1234',
  app_metadata: { provider: 'google', providers: ['google'] },
  user_metadata: { name: 'Test User', email: 'test@example.com' },
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const MOCK_SESSION = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
  token_type: 'bearer',
  user: MOCK_USER,
}

/**
 * Set up mock Supabase session and intercept all API calls.
 * Uses both localStorage injection AND fetch mocking for reliability.
 */
async function setupMockAuth(page: Page) {
  // Inject session into localStorage before page load
  // The actual Supabase project ref is derived from the env var NEXT_PUBLIC_SUPABASE_URL
  // We set it for all possible keys to ensure coverage
  await page.addInitScript(() => {
    const session = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      token_type: 'bearer',
      user: {
        id: 'test-user-id-1234',
        app_metadata: { provider: 'google', providers: ['google'] },
        user_metadata: { name: 'Test User', email: 'test@example.com' },
        aud: 'authenticated',
        role: 'authenticated',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    }
    // Set session for ALL possible Supabase project ref keys
    // The key format is: sb-{projectRef}-auth-token
    // We scan existing keys and also set common patterns
    localStorage.setItem('sb-localhost-auth-token', JSON.stringify(session))
    localStorage.setItem('sb-sijrqtsncrvbzqhyazmb-auth-token', JSON.stringify(session))

    // Also update any existing sb-*-auth-token keys
    const allKeys = Object.keys(localStorage)
    allKeys.forEach((k) => {
      if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
        localStorage.setItem(k, JSON.stringify(session))
      }
    })
  })

  // Mock ALL requests to Supabase API endpoints (any domain)
  // This catches any network calls the Supabase client might make
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.includes('/auth/v1/session')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSION),
      })
    } else if (url.includes('/auth/v1/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      })
    } else if (url.includes('/auth/v1/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SESSION),
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      })
    }
  })

  // Mock REST API endpoints
  await page.route('**/rest/v1/ledger_entries*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
        headers: { 'content-range': '*/0' },
      })
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'new-entry-id', created_at: new Date().toISOString() }]),
      })
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' })
    } else {
      await route.continue()
    }
  })

  await page.route('**/rest/v1/api_keys*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
        headers: { 'content-range': '*/0' },
      })
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'new-key-id', created_at: new Date().toISOString() }]),
      })
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' })
    } else if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'updated-key-id' }]),
      })
    } else {
      await route.continue()
    }
  })
}

/** Override ledger API to return specific entries */
async function overrideLedgerApi(page: Page, entries: unknown[]) {
  await page.route('**/rest/v1/ledger_entries*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(entries),
        headers: { 'content-range': `0-${entries.length - 1}/${entries.length}` },
      })
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'new-entry-id', created_at: new Date().toISOString() }]),
      })
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' })
    } else {
      await route.continue()
    }
  })
}

/** Override vault API to return specific keys */
async function overrideVaultApi(page: Page, keys: unknown[]) {
  await page.route('**/rest/v1/api_keys*', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(keys),
        headers: { 'content-range': `0-${keys.length - 1}/${keys.length}` },
      })
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'new-key-id', created_at: new Date().toISOString() }]),
      })
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204, body: '' })
    } else if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'updated-key-id' }]),
      })
    } else {
      await route.continue()
    }
  })
}

// Extend Playwright test with custom fixtures
type AuthFixtures = {
  authPage: Page
}

type GuestFixtures = {
  guestPage: Page
}

/** Test fixture for authenticated user scenarios */
export const test = base.extend<AuthFixtures>({
  authPage: async ({ page }, use) => {
    await setupMockAuth(page)
    await use(page)
  },
})

/** Test fixture for unauthenticated (guest) scenarios */
export const guestTest = base.extend<GuestFixtures>({
  guestPage: async ({ page }, use) => {
    // Mock auth to return no session (unauthenticated)
    await page.route('**/auth/v1/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/auth/v1/session')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
      } else if (url.includes('/auth/v1/user')) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'not authenticated' }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        })
      }
    })
    await use(page)
  },
})

export { expect, overrideLedgerApi, overrideVaultApi }
