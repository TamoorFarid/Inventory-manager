import { BlogPostsTab } from '@/components/site-data/blog-posts-tab';
import { HomeSliderTab } from '@/components/site-data/home-slider-tab';
import { ShopBrandsTab } from '@/components/site-data/shop-brands-tab';
import { ShopCategoriesTab } from '@/components/site-data/shop-categories-tab';
import { ShopItemsTab } from '@/components/site-data/shop-items-tab';
import { SitePartnersTab } from '@/components/site-data/site-partners-tab';
import { SiteProjectsTab } from '@/components/site-data/site-projects-tab';
import { SiteQuotationsTab } from '@/components/site-data/site-quotations-tab';
import { SiteSettingsTab } from '@/components/site-data/site-settings-tab';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SITE_DATA_TABS } from '@/lib/constants';

export default function SiteDataPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Manage everything shown on the public SunPulse website — blog posts, shop products, showcase projects, partner logos, and site-wide copy. Available to every team member."
        eyebrow="Site Data"
        title="SunPulse Website Content"
      />

      <Tabs defaultValue="blogs">
        <TabsList>
          {SITE_DATA_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="blogs">
          <BlogPostsTab />
        </TabsContent>
        <TabsContent value="shop">
          <ShopItemsTab />
        </TabsContent>
        <TabsContent value="categories">
          <ShopCategoriesTab />
        </TabsContent>
        <TabsContent value="brands">
          <ShopBrandsTab />
        </TabsContent>
        <TabsContent value="projects">
          <SiteProjectsTab />
        </TabsContent>
        <TabsContent value="quotations">
          <SiteQuotationsTab />
        </TabsContent>
        <TabsContent value="partners">
          <SitePartnersTab />
        </TabsContent>
        <TabsContent value="home-slider">
          <HomeSliderTab />
        </TabsContent>
        <TabsContent value="settings">
          <SiteSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
