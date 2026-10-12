// @ts-check
import { defineConfig } from 'astro/config';

// Static site. `PREVIEW=1` builds every page as a flat .html file for the single-folder preview.
export default defineConfig({
  build: process.env.PREVIEW ? { format: 'file', assets: 'assets' } : { format: 'directory' },
  devToolbar: { enabled: false },
});
