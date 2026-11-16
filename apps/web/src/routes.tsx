import { createBrowserRouter } from 'react-router'
import { HomePlaceholder } from './pages/HomePlaceholder.tsx'

export const router = createBrowserRouter([{ path: '/', element: <HomePlaceholder /> }])
