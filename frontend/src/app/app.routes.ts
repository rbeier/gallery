import type { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then((m) => m.Home),
  },
  {
    path: 'albums',
    loadComponent: () => import('./pages/albums').then((m) => m.Albums),
  },
  {
    path: 'albums/:albumId',
    loadComponent: () => import('./pages/album-detail').then((m) => m.AlbumDetail),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search').then((m) => m.Search),
  },
  {
    path: 'photo/:id',
    loadComponent: () => import('./pages/photo-detail').then((m) => m.PhotoDetail),
  },
  { path: '**', redirectTo: '' },
]
