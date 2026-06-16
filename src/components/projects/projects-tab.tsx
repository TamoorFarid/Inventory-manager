import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Loader2, MoreVertical, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { getErrorMessage } from '@/lib/errors';
import { projectService } from '@/services/projectService';
import type { Project } from '@/types/domain';

interface Props {
  companyId: string;
}

function formatPKR(val: number) {
  return `Rs. ${val.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ProjectsTab({ companyId }: Props) {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectToComplete, setProjectToComplete] = useState<Project | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await projectService.listProjects(companyId);
      setProjects(data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load projects.'));
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleComplete = async () => {
    if (!projectToComplete || !profile) return;
    setIsCompleting(true);
    try {
      await projectService.completeProject(projectToComplete.id, profile.id);
      toast.success('Project marked as completed.');
      setProjectToComplete(null);
      await loadProjects();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to complete project.'));
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track and manage installation projects for this company.
          </p>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <TrendingUp className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No projects yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Approve a quotation to automatically create a project here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  onMarkComplete={() => setProjectToComplete(project)}
                  project={project}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        onOpenChange={(open) => !open && setProjectToComplete(null)}
        open={Boolean(projectToComplete)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark project as completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark{' '}
              <span className="font-semibold text-slate-900">
                {projectToComplete?.customerName}
              </span>{' '}
              ({projectToComplete?.estId}) as completed and record today as the completion date.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              disabled={isCompleting}
              onClick={() => void handleComplete()}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Completing...
                </>
              ) : (
                'Mark as Completed'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface ProjectCardProps {
  project: Project;
  onMarkComplete: () => void;
}

function ProjectCard({ project, onMarkComplete }: ProjectCardProps) {
  const isCompleted = project.status === 'completed';

  const duration = () => {
    const end = project.completedAt ? new Date(project.completedAt) : new Date();
    const start = new Date(project.startedAt);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Started today' : `${days} day${days === 1 ? '' : 's'}`;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{project.customerName}</p>
          <p className="text-sm font-medium text-green-700">{project.estId}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isCompleted ? (
            <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
              <CheckCircle2 className="size-3" />
              Completed
            </Badge>
          ) : (
            <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
              <span className="inline-block size-2 animate-pulse rounded-full bg-blue-500" />
              In Progress
            </Badge>
          )}

          {!isCompleted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="size-7" size="sm" variant="ghost">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Project actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-green-700 focus:text-green-700"
                  onClick={onMarkComplete}
                >
                  <CheckCircle2 className="size-4" />
                  Mark as Completed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {/* Financial summary */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Quote Total</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {formatPKR(project.quoteTotal)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {formatPKR(project.totalCost)}
          </p>
        </div>
        <div
          className={`rounded-xl px-3 py-2 ${
            project.profitAmount >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <p className="text-xs text-muted-foreground">Profit</p>
          <p
            className={`mt-0.5 text-sm font-bold ${
              project.profitAmount >= 0 ? 'text-green-700' : 'text-red-600'
            }`}
          >
            {formatPKR(project.profitAmount)}
          </p>
          <p
            className={`text-xs font-medium ${
              project.profitPercentage >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {project.profitPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          Started:{' '}
          <span className="font-medium text-slate-700">
            {format(new Date(project.startedAt), 'dd MMM yyyy')}
          </span>
        </span>
        {isCompleted && project.completedAt ? (
          <span>
            Completed:{' '}
            <span className="font-medium text-slate-700">
              {format(new Date(project.completedAt), 'dd MMM yyyy')}
            </span>
          </span>
        ) : null}
        <span>
          Duration: <span className="font-medium text-slate-700">{duration()}</span>
        </span>
      </div>
    </div>
  );
}
