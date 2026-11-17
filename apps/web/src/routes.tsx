import { createBrowserRouter } from 'react-router'
import { UsersPage } from './admin/UsersPage.tsx'
import { LoginPage } from './auth/LoginPage.tsx'
import { RequireRole } from './auth/RequireRole.tsx'
import { CaseEditPage } from './editor/CaseEditPage.tsx'
import { CaseListPage } from './editor/CaseListPage.tsx'
import { EditorLayout } from './editor/EditorLayout.tsx'
import { EditorNotFound } from './editor/EditorNotFound.tsx'
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
    children: [
      { index: true, element: <CaseListPage /> },
      { path: 'cases/new', element: <CaseEditPage /> },
      { path: 'cases/:id', element: <CaseEditPage /> },
      { path: '*', element: <EditorNotFound /> },
    ],
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
