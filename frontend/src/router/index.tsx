import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/auth/LoginPage'
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { OrdersPage } from '@/pages/orders/OrdersPage'
import { NewOrderPage } from '@/pages/orders/NewOrderPage'
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage'
import { ProductsPage } from '@/pages/products/ProductsPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { GroupsPage } from '@/pages/groups/GroupsPage'
import { CashRegisterPage } from '@/pages/cash-register/CashRegisterPage'
import { ReportsPage } from '@/pages/reports/ReportsPage'
import { OrderTrackerPage } from '@/pages/tracker/OrderTrackerPage'

export const router = createBrowserRouter([
  // Rutas públicas
  {
    path: '/track/:orderId',
    element: <OrderTrackerPage />,
  },
  {
    path: '/auth/callback',
    element: <OAuthCallbackPage />,
  },

  // Rutas de invitado
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },

  // Rutas protegidas con AppShell
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/orders', element: <OrdersPage /> },
          {
            path: '/orders/new',
            element: (
              <ProtectedRoute roles={['admin', 'group_manager', 'cashier']} />
            ),
            children: [{ index: true, element: <NewOrderPage /> }],
          },
          { path: '/orders/:id', element: <OrderDetailPage /> },
          {
            element: <ProtectedRoute roles={['admin', 'group_manager']} />,
            children: [
              { path: '/products', element: <ProductsPage /> },
              { path: '/users', element: <UsersPage /> },
              { path: '/reports', element: <ReportsPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={['admin']} />,
            children: [
              { path: '/groups', element: <GroupsPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={['admin', 'group_manager', 'cashier']} />,
            children: [
              { path: '/cash-register', element: <CashRegisterPage /> },
            ],
          },
        ],
      },
    ],
  },
])
