import {
  Bell,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  Globe,
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
    label: 'Site Data',
    href: '/site-data',
    icon: Globe,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
];

export const SITE_DATA_TABS = [
  { label: 'Blogs', value: 'blogs' },
  { label: 'Shop', value: 'shop' },
  { label: 'Categories', value: 'categories' },
  { label: 'Brands', value: 'brands' },
  { label: 'Projects', value: 'projects' },
  { label: 'Quotations', value: 'quotations' },
  { label: 'Partners', value: 'partners' },
  { label: 'Settings', value: 'settings' },
];

export const PROJECT_TYPES = ['OnGrid', 'Hybrid'] as const;

function placeholderImage(bg: string, fg: string, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="${bg}"/><circle cx="240" cy="128" r="46" fill="${fg}" opacity="0.55"/><path d="M240 90a38 38 0 1 1 0 76 38 38 0 0 1 0-76Zm-150 168c14-40 60-68 150-68s136 28 150 68v18H90v-18Z" fill="${fg}"/><text x="240" y="288" font-family="Arial, sans-serif" font-size="17" fill="${fg}" text-anchor="middle" opacity="0.85">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_BLOG_IMAGE = placeholderImage('#eafaf1', '#2f9e6f', 'SunPulse Blog');
export const DEFAULT_SHOP_IMAGE = placeholderImage('#eafaf1', '#2f9e6f', 'SunPulse Shop');
export const DEFAULT_PROJECT_IMAGE = placeholderImage('#eafaf1', '#2f9e6f', 'SunPulse Project');
export const DEFAULT_PARTNER_LOGO = placeholderImage('#f4fbf7', '#69b795', 'Partner');

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
