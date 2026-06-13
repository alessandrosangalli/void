import { z } from 'zod'

/**
 * Validates environment variables at runtime.
 * This ensures the app fails early if a required variable is missing or invalid.
 */
const envSchema = z
  .object({
    VITE_GOOGLE_CLIENT_ID: z.string().optional(),
    VITE_GOOGLE_API_KEY: z.string().optional(),
    VITE_USE_FAKE_DRIVE: z.preprocess((val) => {
      if (val === undefined || val === '') return true
      return val === 'true' || val === true
    }, z.boolean().default(true)),
  })
  .refine(
    (data) => {
      if (!data.VITE_USE_FAKE_DRIVE) {
        return (
          !!data.VITE_GOOGLE_CLIENT_ID &&
          data.VITE_GOOGLE_CLIENT_ID.trim() !== '' &&
          data.VITE_GOOGLE_CLIENT_ID !== 'your_client_id_here.apps.googleusercontent.com' &&
          !!data.VITE_GOOGLE_API_KEY &&
          data.VITE_GOOGLE_API_KEY.trim() !== '' &&
          data.VITE_GOOGLE_API_KEY !== 'your_api_key_here'
        )
      }
      return true
    },
    {
      message: 'Google Client ID and API Key are required when VITE_USE_FAKE_DRIVE is false',
      path: ['VITE_GOOGLE_CLIENT_ID'],
    }
  )

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
