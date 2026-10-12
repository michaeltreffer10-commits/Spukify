import { lazy } from 'react'

// 3D wird erst geladen, wenn es gebraucht wird – so startet das Spiel schneller.
export const Inspect3D = lazy(() => import('./Inspect3D'))
export const Case3D = lazy(() => import('./Case3D'))
export const ForgeViewer = lazy(() => import('./forge/ForgeViewer'))
