/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Type declarations for Google API (gapi) and Google Identity Services (gis).
 * These are loaded via external <script> tags and exist on window at runtime.
 */

interface GapiClient {
  init(config: { apiKey: string; discoveryDocs: string[] }): Promise<void>
  getToken(): { access_token: string } | null
  drive: {
    files: {
      list(params: Record<string, any>): Promise<{ result: { files: any[] } }>
      get(params: Record<string, any>): Promise<{ result: any }>
    }
  }
}

interface Gapi {
  load(api: string, callback: () => void): void
  client: GapiClient
}

interface GoogleAccountsOAuth2 {
  initTokenClient(config: {
    client_id: string
    scope: string
    callback: string | ((resp: { error?: string }) => void)
  }): {
    callback: string | ((resp: { error?: string }) => void)
    requestAccessToken(config: { prompt: string }): void
  }
}

declare global {
  interface Window {
    gapi: Gapi
    google: {
      accounts: {
        oauth2: GoogleAccountsOAuth2
      }
    }
  }
}

export {}
