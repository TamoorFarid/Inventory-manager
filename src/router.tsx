import { Suspense, lazy } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';

import { LoadingGrid } from '@/components/shared/loading-state';
import { useAuth } from '@/hooks/use-auth';
import { AppLayout } from '@/layouts/app-layout';

const DashboardPage = lazy(() => import('@/pages/dashboard-page'));
const LoginPage = lazy(() => import('@/pages/login-page'));
const CompaniesPage = lazy(() => import('@/pages/companies-page'));
const CompanyDetailPage = lazy(() => import('@/pages/company-detail-page'));
const InventoryPage = lazy(() => import('@/pages/inventory-page'));
const SiteDataPage = lazy(() => import('@/pages/site-data-page'));
const SalesHistoryPage = lazy(() => import('@/pages/sales-history-page'));
const NotificationsPage = lazy(() => import('@/pages/notifications-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));

function RouteLoader() {
  return (
    <div className="space-y-4">
      <LoadingGrid />
    </div>
  );
}

function AuthenticatedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}

function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoader />;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}

function AdminRoute() {
  const { profile } = useAuth();

  if (profile?.role !== 'admin') {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: withSuspense(<LoginPage />),
      },
    ],
  },
  {
    element: <AuthenticatedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: withSuspense(<DashboardPage />),
          },
          {
            path: '/companies',
            element: withSuspense(<CompaniesPage />),
          },
          {
            path: '/companies/:companyId',
            element: withSuspense(<CompanyDetailPage />),
          },
          {
            path: '/companies/:companyId/inventory',
            element: withSuspense(<InventoryPage />),
          },
          {
            path: '/site-data',
            element: withSuspense(<SiteDataPage />),
          },
          {
            path: '/companies/:companyId/sales',
            element: withSuspense(<SalesHistoryPage />),
          },
          {
            path: '/notifications',
            element: withSuspense(<NotificationsPage />),
          },
          {
            element: <AdminRoute />,
            children: [],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(<NotFoundPage />),
  },
]);
