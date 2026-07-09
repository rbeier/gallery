import type { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'albums/:albumId',
    loadComponent: () => import('./pages/album-detail/album-detail').then((m) => m.AlbumDetail),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search').then((m) => m.Search),
  },
  {
    path: 'photo/:id',
    loadComponent: () => import('./pages/photo-detail/photo-detail').then((m) => m.PhotoDetail),
  },
  { path: '**', redirectTo: '' },
]
