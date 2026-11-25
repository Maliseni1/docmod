import posthog from 'posthog-js'

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_POSTHOG_HOST
export const isPostHogConfigured = Boolean(posthogKey && posthogHost)

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    defaults: '2026-08-30',
    logs: {
      serviceName: 'docmod-web',
      environment: import.meta.env.MODE,
    },
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  })
} else if (import.meta.env.DEV) {
  if (!posthogKey) {
    throw new Error(
      'VITE_POSTHOG_KEY variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_KEY is configured',
    )
  }

  throw new Error(
    'VITE_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_POSTHOG_HOST is configured',
  )
}

export const conversionLogger = {
  info(message, attributes) {
    if (isPostHogConfigured) {
      posthog.logger.info(message, attributes)
    }
  },
  error(message, attributes) {
    if (isPostHogConfigured) {
      posthog.logger.error(message, attributes)
    }
  },
}

export default posthog
