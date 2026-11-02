import { api } from './api'

export async function loadAdminOverview(accessToken) {
  return api.get('/admin/overview', { accessToken })
}

export function formatNaira(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}
