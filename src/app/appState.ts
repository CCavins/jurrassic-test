export type AppScreen = 'home' | 'select' | 'ar' | 'preview' | 'credits'

export interface AppError {
  code: string
  title: string
  message: string
  actionLabel?: string
}
