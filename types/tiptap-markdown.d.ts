import type { MarkdownStorage } from 'tiptap-markdown';
import type { Storage } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Storage {
    markdown: MarkdownStorage;
  }
}

export {};
