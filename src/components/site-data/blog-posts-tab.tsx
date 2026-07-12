import { useCallback, useEffect, useState } from 'react';
import { FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { ImageUploadField } from '@/components/site-data/image-upload-field';
import { RichTextEditor } from '@/components/site-data/rich-text-editor';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { DEFAULT_BLOG_IMAGE } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import { siteContentService } from '@/services/siteContentService';
import type { SiteBlogPost } from '@/types/domain';

interface FormState {
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  authorName: string;
  isPublished: boolean;
}

const emptyForm: FormState = {
  title: '',
  excerpt: '',
  content: '',
  coverImageUrl: null,
  authorName: '',
  isPublished: true,
};

export function BlogPostsTab() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<SiteBlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SiteBlogPost | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postToDelete, setPostToDelete] = useState<SiteBlogPost | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      setPosts(await siteContentService.listBlogPosts());
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load blog posts.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const openCreate = () => {
    setEditingPost(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (post: SiteBlogPost) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      excerpt: post.excerpt ?? '',
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      authorName: post.authorName ?? '',
      isPublished: post.isPublished,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!profile || !form.title.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingPost) {
        await siteContentService.updateBlogPost(editingPost.id, form, profile.id);
        toast.success('Blog post updated.');
      } else {
        await siteContentService.createBlogPost(form, profile.id);
        toast.success('Blog post published.');
      }
      setDialogOpen(false);
      await loadPosts();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save blog post.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete || !profile) return;
    try {
      await siteContentService.deleteBlogPost(postToDelete.id, profile.id);
      toast.success('Blog post deleted.');
      setPostToDelete(null);
      await loadPosts();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete blog post.'));
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Blog posts</CardTitle>
            <p className="text-sm text-muted-foreground">
              Written here, published live on the SunPulse website.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New post
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-slate-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FileText className="h-7 w-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No blog posts yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Write your first post to start filling the SunPulse blog.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={post.id}>
                  <img
                    alt={post.title}
                    className="h-36 w-full object-cover"
                    src={post.coverImageUrl || DEFAULT_BLOG_IMAGE}
                  />
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-semibold text-slate-900">{post.title}</p>
                      {post.isPublished ? (
                        <Badge className="shrink-0" variant="success">Published</Badge>
                      ) : (
                        <Badge className="shrink-0" variant="outline">Draft</Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {post.excerpt || 'No excerpt provided.'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {post.authorName || 'SunPulse Team'} • {formatDate(post.publishedAt)}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button className="flex-1" onClick={() => openEdit(post)} size="sm" variant="outline">
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button onClick={() => setPostToDelete(post)} size="sm" variant="ghost">
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit blog post' : 'New blog post'}</DialogTitle>
            <DialogDescription>
              Rich text content renders directly on the public blog page.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="blog-title">Title</Label>
              <Input
                id="blog-title"
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="5 Reasons to Switch to Solar in 2026"
                value={form.title}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
                placeholder="Short summary shown on the blog listing page"
                value={form.excerpt}
              />
            </div>

            <ImageUploadField
              defaultImage={DEFAULT_BLOG_IMAGE}
              folder="blogs"
              label="Cover image"
              onChange={(url) => setForm((current) => ({ ...current, coverImageUrl: url }))}
              value={form.coverImageUrl}
            />

            <RichTextEditor
              initialValue={form.content}
              key={editingPost?.id ?? 'new-blog'}
              label="Content"
              onChange={(html) => setForm((current) => ({ ...current, content: html }))}
              placeholder="Write the blog post..."
            />

            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="blog-author">Author name</Label>
                <Input
                  id="blog-author"
                  onChange={(event) => setForm((current) => ({ ...current, authorName: event.target.value }))}
                  placeholder="SunPulse Team"
                  value={form.authorName}
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
              {isSubmitting ? 'Saving...' : editingPost ? 'Save changes' : 'Publish post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog onOpenChange={(open) => !open && setPostToDelete(null)} open={Boolean(postToDelete)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-900">{postToDelete?.title}</span> will be removed
              from the public blog. This performs a soft delete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Delete post</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
