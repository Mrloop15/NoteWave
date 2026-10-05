import axios from 'axios'

export const http = axios.create({
  baseURL: '/',
  timeout: 10_000,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
})
