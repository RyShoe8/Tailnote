'use client';

import { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Code,
  Minus,
  Megaphone,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type BlogEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  className?: string;
};

const CALLOUT_TEMPLATE = `<Callout variant="info" title="Title">
Your text here
</Callout>`;

function ctaTemplate(variant: 'signatures' | 'team' | 'email-health'): string {
  return `<BlogTailnoteCta variant="${variant}" />`;
}

export function BlogEditor({ value, onChange, className }: BlogEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline underline-offset-4' },
      }),
      Placeholder.configure({
        placeholder: 'Write your post…',
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'blog-prose min-h-[320px] max-w-none px-4 py-3 focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = ed.storage.markdown.getMarkdown();
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    if (value !== current) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const insertRaw = useCallback(
    (text: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(`\n\n${text}\n\n`).run();
    },
    [editor]
  );

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  const tools = [
    {
      label: 'Bold',
      icon: Bold,
      active: editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: Italic,
      active: editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Underline',
      icon: UnderlineIcon,
      active: editor.isActive('underline'),
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: 'Heading 2',
      icon: Heading2,
      active: editor.isActive('heading', { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Heading 3',
      icon: Heading3,
      active: editor.isActive('heading', { level: 3 }),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: 'Bullet list',
      icon: List,
      active: editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Ordered list',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Blockquote',
      icon: Quote,
      active: editor.isActive('blockquote'),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: 'Link',
      icon: LinkIcon,
      active: editor.isActive('link'),
      action: setLink,
    },
    {
      label: 'Code block',
      icon: Code,
      active: editor.isActive('codeBlock'),
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: 'Horizontal rule',
      icon: Minus,
      active: false,
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ] as const;

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>
      <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50/95 p-2 backdrop-blur">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            variant={tool.active ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={tool.action}
            aria-label={tool.label}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          onClick={() => insertRaw(CALLOUT_TEMPLATE)}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Callout
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          onClick={() => insertRaw(ctaTemplate('signatures'))}
        >
          <Megaphone className="h-3.5 w-3.5" />
          CTA
        </Button>
        <select
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value as 'signatures' | 'team' | 'email-health' | '';
            if (v) {
              insertRaw(ctaTemplate(v));
              e.target.value = '';
            }
          }}
          aria-label="Insert CTA variant"
        >
          <option value="">CTA variant…</option>
          <option value="signatures">Signatures</option>
          <option value="team">Team</option>
          <option value="email-health">Email health</option>
        </select>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
