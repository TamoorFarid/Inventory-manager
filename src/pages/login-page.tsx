import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { AppLogo } from '@/components/shared/app-logo';
import { FormInput } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { loginSchema, type LoginValues } from '@/lib/validators';

export default function LoginPage() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@sunpulse.com',
      password: 'Admin@123',
    },
  });

  if (isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);

    try {
      await signIn(values);
      toast.success('Welcome back to SunPulse Inventory.');
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to sign in.'));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f8fb]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(43,124,104,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_26%)]" />
      <div className="absolute inset-0 bg-grid bg-[size:46px_46px] opacity-30" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-[2rem] border border-white/70 bg-white/70 p-8 shadow-panel backdrop-blur-xl lg:block lg:p-12">
            <AppLogo />
            <div className="mt-14 max-w-xl space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                Modern inventory operations
              </p>
              <h1 className="font-display text-5xl font-semibold leading-tight tracking-tight text-slate-950">
                A polished command center for multi-company stock, sales, and notifications.
              </h1>
              <p className="text-lg leading-8 text-muted-foreground">
                Manage inventory with company-level security, real-time activity, and a layout designed to feel like a premium SaaS dashboard from day one.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <Card className="bg-white/90">
                <CardContent className="p-6">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-slate-950">
                    Company-scoped security
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    RLS-backed access keeps members limited to their assigned company records.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/90">
                <CardContent className="p-6">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-chart-2/10 text-chart-2">
                    <LockKeyhole className="size-5" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-slate-950">
                    Admin-controlled access
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    No public signup. Admin creates users, memberships, and company workspaces securely.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Card className="w-full max-w-xl overflow-hidden">
              <div className="bg-gradient-to-br from-primary/10 via-white to-chart-2/10 p-8">
                <AppLogo className="lg:hidden" />
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
                    Secure login
                  </p>
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                    Sign in to continue
                  </h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Use the seeded admin account below after you run the Supabase setup.
                  </p>
                </div>
              </div>

              <CardContent className="space-y-6 p-8">
                <div className="rounded-[1.5rem] border border-primary/10 bg-primary/5 p-4 text-sm text-slate-700">
                  Demo admin credentials:
                  {' '}
                  <span className="font-semibold">admin@sunpulse.com</span>
                  {' '}
                  /
                  {' '}
                  <span className="font-semibold">Admin@123</span>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <FormInput
                    error={form.formState.errors.email}
                    label="Email"
                    name="email"
                    placeholder="admin@sunpulse.com"
                    register={form.register}
                    type="email"
                  />
                  <FormInput
                    error={form.formState.errors.password}
                    label="Password"
                    name="password"
                    placeholder="Enter your password"
                    register={form.register}
                    type="password"
                  />
                  <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Access dashboard'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
