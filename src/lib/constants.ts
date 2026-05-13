import {
  Bell,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  LayoutDashboard,
} from 'lucide-react';

export const APP_NAME = 'SunPulse Inventory';
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
    title: 'Inventory discipline',
    description: 'Watch low-stock pressure before it becomes lost revenue.',
    icon: Boxes,
  },
  {
    title: 'Company visibility',
    description: 'Compare activity across every company you manage.',
    icon: Building2,
  },
  {
    title: 'Revenue insight',
    description: 'Track sales momentum with live notifications and charts.',
    icon: ChartNoAxesCombined,
  },
];
