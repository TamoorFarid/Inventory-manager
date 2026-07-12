import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, Pencil, Plus, Sun, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ImageUploadField } from '@/components/site-data/image-upload-field';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { DEFAULT_PROJECT_IMAGE, PROJECT_TYPES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { siteContentService } from '@/services/siteContentService';
import type { ProjectType, SiteProject } from '@/types/domain';

interface FormState {
  title: string;
  description: string;
  location: string;
  capacityKw: string;
  imageUrl: string | null;
  completedOn: string;
  projectType: ProjectType;
  isPublished: boolean;
  sortOrder: string;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  location: '',
  capacityKw: '',
  imageUrl: null,
  completedOn: '',
  projectType: 'OnGrid',
  isPublished: true,
  sortOrder: '0',
};

export function SiteProjectsTab() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<SiteProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<SiteProject | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<SiteProject | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      setProjects(await siteContentService.listSiteProjects());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load projects.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const openCreate = () => {
    setEditingProject(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (project: SiteProject) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      description: project.description ?? '',
      location: project.location ?? '',
      capacityKw: project.capacityKw ? String(project.capacityKw) : '',
      imageUrl: project.imageUrl,
      completedOn: project.completedOn ?? '',
      projectType: project.projectType,
      isPublished: project.isPublished,
      sortOrder: String(project.sortOrder),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!profile || !form.title.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        capacityKw: form.capacityKw ? Number(form.capacityKw) : null,
        imageUrl: form.imageUrl,
        completedOn: form.completedOn || null,
        projectType: form.projectType,
        isPublished: form.isPublished,
        sortOrder: Number(form.sortOrder) || 0,
      };

      if (editingProject) {
        await siteContentService.updateSiteProject(editingProject.id, payload, profile.id);
        toast.success('Project updated.');
      } else {
        await siteContentService.createSiteProject(payload, profile.id);
        toast.success('Project added.');
      }
      setDialogOpen(false);
      await loadProjects();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save project.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete || !profile) return;
    try {
      await siteContentService.deleteSiteProject(projectToDelete.id, profile.id);
      toast.success('Project deleted.');
      setProjectToDelete(null);
      await loadProjects();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete project.'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Showcase projects</CardTitle>
            <p className="text-sm text-muted-foreground">
              Completed installations shown on the SunPulse projects page.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New project
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Sun className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No showcase projects yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Add a completed installation to feature it on the public site.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={project.id}>
                  <img
                    alt={project.title}
                    className="h-36 w-full object-cover"
                    src={project.imageUrl || DEFAULT_PROJECT_IMAGE}
                  />
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-slate-900">{project.title}</p>
                      {project.isPublished ? (
                        <Badge className="shrink-0" variant="success">Published</Badge>
                      ) : (
                        <Badge className="shrink-0" variant="outline">Draft</Badge>
                      )}
                    </div>
                    <Badge variant="outline">{project.projectType}</Badge>
                    {project.location ? (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {project.location}
                        {project.capacityKw ? ` • ${project.capacityKw} kW` : ''}
                      </p>
                    ) : null}
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {project.description || 'No description provided.'}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button className="flex-1" onClick={() => openEdit(project)} size="sm" variant="outline">
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button onClick={() => setProjectToDelete(project)} size="sm" variant="ghost">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit project' : 'New showcase project'}</DialogTitle>
            <DialogDescription>Featured on the public SunPulse projects page.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="project-title">Title</Label>
              <Input
                id="project-title"
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="10kW Rooftop Installation — DHA Lahore"
                value={form.title}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Project summary shown on the public site"
                value={form.description}
              />
            </div>

            <ImageUploadField
              defaultImage={DEFAULT_PROJECT_IMAGE}
              folder="projects"
              label="Project photo"
              onChange={(url) => setForm((current) => ({ ...current, imageUrl: url }))}
              value={form.imageUrl}
            />

            <div className="space-y-2">
              <Label htmlFor="project-type">Project type</Label>
              <Select
                onValueChange={(value) => setForm((current) => ({ ...current, projectType: value as ProjectType }))}
                value={form.projectType}
              >
                <SelectTrigger id="project-type">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="project-location">Location</Label>
                <Input
                  id="project-location"
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Lahore, Pakistan"
                  value={form.location}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-capacity">Capacity (kW)</Label>
                <Input
                  id="project-capacity"
                  onChange={(event) => setForm((current) => ({ ...current, capacityKw: event.target.value }))}
                  type="number"
                  value={form.capacityKw}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-completed">Completed on</Label>
                <Input
                  id="project-completed"
                  onChange={(event) => setForm((current) => ({ ...current, completedOn: event.target.value }))}
                  type="date"
                  value={form.completedOn}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="project-sort">Display order</Label>
                <Input
                  id="project-sort"
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  type="number"
                  value={form.sortOrder}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Published</p>
                  <p className="text-xs text-muted-foreground">Visible on the public site</p>
                </div>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isPublished: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isSubmitting || !form.title.trim()} onClick={() => void handleSubmit()}>
              {isSubmitting ? 'Saving...' : editingProject ? 'Save changes' : 'Add project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setProjectToDelete(null)} open={Boolean(projectToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-900">{projectToDelete?.title}</span> will be
              removed from the public site. This performs a soft delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Delete project</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
