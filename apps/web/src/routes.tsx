import { createBrowserRouter } from 'react-router'
import { UsersPage } from './admin/UsersPage.tsx'
import { LoginPage } from './auth/LoginPage.tsx'
import { RequireRole } from './auth/RequireRole.tsx'
import { EditorHomePage } from './editor/EditorHomePage.tsx'
import { EditorLayout } from './editor/EditorLayout.tsx'
import { TrainingPage } from './training/TrainingPage.tsx'

export const router = createBrowserRouter([
  { path: '/', element: <TrainingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/editor',
    element: (
      <RequireRole roles={['trainer', 'admin']}>
        <EditorLayout />
      </RequireRole>
    ),
    children: [{ index: true, element: <EditorHomePage /> }],
  },
  {
    path: '/admin/users',
    element: (
      <RequireRole roles={['admin']}>
        <UsersPage />
      </RequireRole>
    ),
  },
])
