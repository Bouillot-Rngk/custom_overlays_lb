import {
  LeagueBroadcastClient,
  type LeagueBroadcastClientConfig,
} from '@bluebottle_gg/league-broadcast-client'
import { inject, type InjectionKey } from 'vue'

/**
 * Vue injection key for the shared LeagueBroadcastClient instance.
 * Use `useClient()` to access the client in components.
 */
export const ClientKey: InjectionKey<LeagueBroadcastClient> = Symbol('lbc')

// LeagueBroadcast's own port setting (App.json -> "port") wins over the stock
// 58869. This machine's app is configured for 60215; override per-URL with
// ?backendport=<port> if you point a source at a differently configured server.
const DEFAULT_PORT = 60215

/** Default config — connects to a local LeagueBroadcast server. */
export const defaultClientConfig: LeagueBroadcastClientConfig = {
  host: window.location.hostname,
  port: Number(new URLSearchParams(window.location.search).get('backendport')) || DEFAULT_PORT,
  autoConnect: false, // we connect explicitly after the app mounts
}

/**
 * Access the LeagueBroadcastClient instance provided at the app root.
 * Must be called inside a component that is a descendant of the provider.
 */
export function useClient(): LeagueBroadcastClient {
  const client = inject(ClientKey)
  if (!client) {
    throw new Error(
      'LeagueBroadcastClient not provided. Make sure app.provide(ClientKey, client) is called in main.ts.',
    )
  }
  return client
}
