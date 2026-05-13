import {
  Bell,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  LayoutDashboard,
} from 'lucide-react';

export const APP_NAME = 'Solar Inventory';
export const LOW_STOCK_THRESHOLD = 10;
export const DEFAULT_PAGE_SIZE = 8;
export const CURRENCY = 'PKR';

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Companies',
    href: '/companies',
    icon: Building2,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
];

export const COMPANY_TABS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Members', value: 'members' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Sales', value: 'sales' },
  { label: 'Activity', value: 'activity' },
];

export const DASHBOARD_HIGHLIGHTS = [
  {
    title: 'Track inventory',
    description: 'Get alerts when stock runs low so you never miss a sale.',
    icon: Boxes,
  },
  {
    title: 'Manage companies',
    description: 'View and compare activity across all your companies in one place.',
    icon: Building2,
  },
  {
    title: 'Monitor sales',
    description: 'See sales as they happen with live updates and charts.',
    icon: ChartNoAxesCombined,
  },
];
