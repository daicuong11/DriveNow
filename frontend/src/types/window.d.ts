import { store } from '../store/store'

declare global {
  interface Window {
    store: typeof store
  }
}

export {}

