import { useEffect, useRef } from 'react';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Underline,
} from 'lucide-react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  label?: string;
  initialValue: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TOOLBAR_BUTTONS: Array<{ command: string; icon: typeof Bold; label: string; value?: string }> = [
  { command: 'bold', icon: Bold, label: 'Bold' },
  { command: 'italic', icon: Italic, label: 'Italic' },
  { command: 'underline', icon: Underline, label: 'Underline' },
  { command: 'formatBlock', icon: Heading2, label: 'Heading', value: 'h2' },
  { command: 'formatBlock', icon: Heading3, label: 'Subheading', value: 'h3' },
  { command: 'formatBlock', icon: Quote, label: 'Quote', value: 'blockquote' },
  { command: 'insertUnorderedList', icon: List, label: 'Bullet list' },
  { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered list' },
];

/** Lightweight contentEditable rich text editor for blog content — no external dependency required. */
export function RichTextEditor({ label, initialValue, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Set the DOM content imperatively, once, instead of via dangerouslySetInnerHTML.
  // React re-applies dangerouslySetInnerHTML whenever the `initialValue` string
  // changes across renders — and it changes on every keystroke, since onInput
  // below feeds the typed HTML straight back into the parent's state. That reset
  // the whole contentEditable subtree on every character, snapping the cursor
  // back to position 0, so each new character landed before the previous ones
  // (text appeared to type backwards).
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialValue;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    onChange(editorRef.current?.innerHTML ?? '');
  };

  const handleLink = () => {
    const url = window.prompt('Enter link URL');
    if (url) exec('createLink', url);
  };

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <div className="overflow-hidden rounded-xl border border-input bg-white shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-border bg-slate-50 p-2">
          {TOOLBAR_BUTTONS.map(({ command, icon: Icon, label: buttonLabel, value }) => (
            <button
              aria-label={buttonLabel}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-primary/10 hover:text-primary"
              key={buttonLabel}
              onClick={() => exec(command, value)}
              title={buttonLabel}
              type="button"
            >
              <Icon className="size-4" />
            </button>
          ))}
          <button
            aria-label="Insert link"
            className="rounded-lg p-2 text-slate-600 transition hover:bg-primary/10 hover:text-primary"
            onClick={handleLink}
            title="Insert link"
            type="button"
          >
            <Link2 className="size-4" />
          </button>
        </div>
        <div
          className={cn(
            'prose prose-sm min-h-[220px] max-w-none px-4 py-3 text-sm leading-7 text-foreground focus-visible:outline-none',
            '[&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold',
            '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
          )}
          contentEditable
          data-placeholder={placeholder}
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          ref={editorRef}
          suppressContentEditableWarning
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Use the toolbar to format the post body. This is what visitors will see on the blog page.
      </p>
    </div>
  );
}
