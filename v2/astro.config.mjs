import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
    site: 'https://129700.github.io',
    base: '/',
    output: 'static',
    integrations: [sitemap(), mdx()],
    markdown: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
    },
    vite: {
        css: {
            preprocessorOptions: {
                scss: { api: 'modern-compiler' },
            },
        },
    },
    // Disable telemetry to avoid permission issues
    telemetry: false,
});
