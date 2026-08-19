export function publicUrl(path: string): string {
  const clean = path.replace(/^\//, '')
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
  return `${base}${clean}`
}

export function isDebugAr(): boolean {
  return import.meta.env.VITE_DEBUG_AR === 'true' && import.meta.env.DEV
}
