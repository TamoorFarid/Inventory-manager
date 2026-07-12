import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';
import { SITE_SETTINGS_KEYS, type SiteSettingKey, type SiteSettings } from '@/types/domain';

const EMPTY_SETTINGS: SiteSettings = SITE_SETTINGS_KEYS.reduce((acc, key) => {
  acc[key] = '';
  return acc;
}, {} as SiteSettings);

interface FieldProps {
  settingKey: SiteSettingKey;
  label: string;
  value: string;
  onChange: (key: SiteSettingKey, value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}

function Field({ settingKey, label, value, onChange, multiline, placeholder }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={settingKey}>{label}</Label>
      {multiline ? (
        <Textarea
          id={settingKey}
          onChange={(event) => onChange(settingKey, event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      ) : (
        <Input
          id={settingKey}
          onChange={(event) => onChange(settingKey, event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      )}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-base font-semibold text-slate-950">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

// Repeated "card" content blocks (title + body) shown as numbered mini-cards on the public site.
function CardTextFields({
  prefix,
  count,
  settings,
  onChange,
}: {
  prefix: string;
  count: number;
  settings: SiteSettings;
  onChange: (key: SiteSettingKey, value: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => {
        const titleKey = `${prefix}${index + 1}_title` as SiteSettingKey;
        const bodyKey = `${prefix}${index + 1}_body` as SiteSettingKey;
        return (
          <div className="space-y-3 rounded-xl border border-border p-4" key={titleKey}>
            <Field label={`Card ${index + 1} title`} onChange={onChange} settingKey={titleKey} value={settings[titleKey]} />
            <Field
              label={`Card ${index + 1} text`}
              multiline
              onChange={onChange}
              settingKey={bodyKey}
              value={settings[bodyKey]}
            />
          </div>
        );
      })}
    </div>
  );
}

// Shared shape used by the Projects/Shop/Blog "preview" sections on the homepage.
function PreviewSectionFields({
  prefix,
  settings,
  onChange,
}: {
  prefix: 'projects_preview' | 'shop_preview' | 'blog_preview';
  settings: SiteSettings;
  onChange: (key: SiteSettingKey, value: string) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Eyebrow" onChange={onChange} settingKey={`${prefix}_eyebrow` as SiteSettingKey} value={settings[`${prefix}_eyebrow` as SiteSettingKey]} />
        <Field
          label="Title"
          onChange={onChange}
          settingKey={`${prefix}_title` as SiteSettingKey}
          value={settings[`${prefix}_title` as SiteSettingKey]}
        />
        <Field
          label="Description"
          onChange={onChange}
          settingKey={`${prefix}_description` as SiteSettingKey}
          value={settings[`${prefix}_description` as SiteSettingKey]}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Empty state title"
          onChange={onChange}
          settingKey={`${prefix}_empty_title` as SiteSettingKey}
          value={settings[`${prefix}_empty_title` as SiteSettingKey]}
        />
        <Field
          label="Empty state text"
          multiline
          onChange={onChange}
          settingKey={`${prefix}_empty_description` as SiteSettingKey}
          value={settings[`${prefix}_empty_description` as SiteSettingKey]}
        />
      </div>
    </>
  );
}

export function SiteSettingsTab() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(EMPTY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      setSettings(await siteContentService.getSettings());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load site settings.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleChange = (key: SiteSettingKey, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await siteContentService.updateSettings(settings, profile.id);
      toast.success('Site settings saved.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save site settings.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Site settings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Every piece of copy on the Home and About pages of the SunPulse website — edit anything
            here and it updates live. Button labels are fixed and not editable.
          </p>
        </div>
        <Button disabled={isSaving} onClick={() => void handleSave()}>
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save settings
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        <Section title="Contact & WhatsApp">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <Label htmlFor="whatsapp_number">WhatsApp number</Label>
            <p className="mb-2 text-xs text-muted-foreground">
              Digits only, with country code (e.g. 923001234567). Used by every WhatsApp button on
              the website.
            </p>
            <Input
              id="whatsapp_number"
              onChange={(event) => handleChange('whatsapp_number', event.target.value)}
              placeholder="923001234567"
              value={settings.whatsapp_number}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact email" onChange={handleChange} settingKey="contact_email" value={settings.contact_email} />
            <Field label="Contact address" onChange={handleChange} settingKey="contact_address" value={settings.contact_address} />
          </div>
        </Section>

        <Separator />

        <Section description="The first thing visitors see on the homepage." title="Home — Hero">
          <Field label="Eyebrow badge" onChange={handleChange} settingKey="hero_eyebrow" value={settings.hero_eyebrow} />
          <Field label="Headline" onChange={handleChange} settingKey="hero_headline" value={settings.hero_headline} />
          <Field label="Subheadline" multiline onChange={handleChange} settingKey="hero_subheadline" value={settings.hero_subheadline} />
          <div className="grid gap-4 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <div className="space-y-3 rounded-xl border border-border p-4" key={n}>
                <Field
                  label={`Stat ${n} value`}
                  onChange={handleChange}
                  settingKey={`hero_stat${n}_value` as SiteSettingKey}
                  value={settings[`hero_stat${n}_value` as SiteSettingKey]}
                />
                <Field
                  label={`Stat ${n} label`}
                  onChange={handleChange}
                  settingKey={`hero_stat${n}_label` as SiteSettingKey}
                  value={settings[`hero_stat${n}_label` as SiteSettingKey]}
                />
              </div>
            ))}
          </div>
        </Section>

        <Separator />

        <Section description="Image + copy block introducing SunPulse on the homepage." title="Home — Why choose SunPulse">
          <Field
            label="Heading"
            onChange={handleChange}
            settingKey="about_teaser_heading"
            value={settings.about_teaser_heading}
          />
          <p className="text-xs text-muted-foreground">
            Uses the same "About us title" and "About us content" as the About page (below).
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <Field
                key={n}
                label={`Bullet point ${n}`}
                onChange={handleChange}
                settingKey={`about_teaser_point${n}` as SiteSettingKey}
                value={settings[`about_teaser_point${n}` as SiteSettingKey]}
              />
            ))}
          </div>
        </Section>

        <Separator />

        <Section
          description="Scrolling strip of brand names, sourced live from the Brands tab. Deleting or renaming a brand there updates this automatically."
          title="Home — Brands marquee"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Marquee title"
              onChange={handleChange}
              settingKey="brands_marquee_title"
              value={settings.brands_marquee_title}
            />
            <Field
              label="Empty state text (shown before any brands are added)"
              onChange={handleChange}
              settingKey="brands_marquee_empty_text"
              value={settings.brands_marquee_empty_text}
            />
          </div>
        </Section>

        <Separator />

        <Section title="Home — Projects preview">
          <PreviewSectionFields onChange={handleChange} prefix="projects_preview" settings={settings} />
        </Section>

        <Separator />

        <Section title="Home — Shop preview">
          <PreviewSectionFields onChange={handleChange} prefix="shop_preview" settings={settings} />
        </Section>

        <Separator />

        <Section title="Home — Blog preview">
          <PreviewSectionFields onChange={handleChange} prefix="blog_preview" settings={settings} />
        </Section>

        <Separator />

        <Section title="Home — Partners marquee">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Marquee title"
              onChange={handleChange}
              settingKey="partners_marquee_title"
              value={settings.partners_marquee_title}
            />
            <Field
              label="Empty state text (shown before any partners are added)"
              onChange={handleChange}
              settingKey="partners_marquee_empty_text"
              value={settings.partners_marquee_empty_text}
            />
          </div>
        </Section>

        <Separator />

        <Section description="Shown at the bottom of both the Home and About pages." title="Home & About — Call to action">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Heading" onChange={handleChange} settingKey="cta_heading" value={settings.cta_heading} />
            <Field
              label="Description"
              multiline
              onChange={handleChange}
              settingKey="cta_description"
              value={settings.cta_description}
            />
          </div>
        </Section>

        <Separator />

        <Section description="Also reused in the 'Why choose SunPulse' section above." title="About page — Intro">
          <Field
            label="Eyebrow badge"
            onChange={handleChange}
            settingKey="about_page_eyebrow"
            value={settings.about_page_eyebrow}
          />
          <Field label="Title" onChange={handleChange} settingKey="about_title" value={settings.about_title} />
          <Field label="Body" multiline onChange={handleChange} settingKey="about_body" value={settings.about_body} />
        </Section>

        <Separator />

        <Section description="The three value cards under the About page intro." title="About page — Our values">
          <CardTextFields count={3} onChange={handleChange} prefix="about_value" settings={settings} />
        </Section>

        <Separator />

        <Section title="About page — How we work">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Section heading"
              onChange={handleChange}
              settingKey="about_process_heading"
              value={settings.about_process_heading}
            />
            <Field
              label="Section description"
              onChange={handleChange}
              settingKey="about_process_description"
              value={settings.about_process_description}
            />
          </div>
          <CardTextFields count={3} onChange={handleChange} prefix="about_process" settings={settings} />
        </Section>
      </CardContent>
    </Card>
  );
}
