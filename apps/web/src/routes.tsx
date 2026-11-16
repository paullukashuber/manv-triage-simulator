import { createBrowserRouter } from 'react-router'
import { TrainingPage } from './training/TrainingPage.tsx'

export const router = createBrowserRouter([{ path: '/', element: <TrainingPage /> }])
