import { z } from 'zod'

/**
 * Validates environment variables at runtime.
 * This ensures the app fails early if a required variable is missing or invalid.
 */
const envSchema = z.object({
  VITE_GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  VITE_GOOGLE_API_KEY: z.string().min(1, 'Google API Key is required'),
  VITE_USE_FAKE_DRIVE: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().default(false)
  ),
})

// Parse and export variables
const _env = envSchema.safeParse({
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  VITE_GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
  VITE_USE_FAKE_DRIVE: import.meta.env.VITE_USE_FAKE_DRIVE,
})

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format())
  throw new Error('Invalid environment variables')
}

export const env = _env.data
