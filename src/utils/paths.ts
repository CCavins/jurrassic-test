export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  const clean = path.replace(/^\//, '')
  return `${base}${clean}`
}

export function isDebugAr(): boolean {
  return import.meta.env.VITE_DEBUG_AR === 'true' && import.meta.env.DEV
}
