type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    __TMTI_EVENTS__?: Array<{
      name: string
      payload: AnalyticsPayload
      ts: number
    }>
  }
}

export function track(name: string, payload: AnalyticsPayload = {}) {
  if (typeof window === 'undefined') {
    return
  }

  const event = {
    name,
    payload,
    ts: Date.now(),
  }

  window.__TMTI_EVENTS__ ??= []
  window.__TMTI_EVENTS__.push(event)

  if (import.meta.env.DEV) {
    console.info('[tmti]', event)
  }
}
