import { RenderMode, type ServerRoute } from '@angular/ssr'

export const serverRoutes: ServerRoute[] = [
  // Server-render on demand so dynamic params (album/photo ids, search query)
  // resolve per request.
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
]
