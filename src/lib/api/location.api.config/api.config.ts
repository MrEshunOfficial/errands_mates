export const API_CONFIG = {
  baseUrl: 'https://category-api-iota.vercel.app/api',
  endpoints: {
    regions: '/regions'
  },
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
} as const;