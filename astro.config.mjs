import { defineConfig } from 'astro/config';
import alpine from '@astrojs/alpinejs';
import mkcert from 'vite-plugin-mkcert'
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import robotsConfig from './robots-txt.config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    site: 'https://tempo-run-astro5.netlify.app/',
    vite: {
        plugins: [mkcert(), tailwindcss()],
        server: {
            https: true
        },
        build: {
            target: 'es2019'
        }
    },
    integrations: [alpine(), sitemap(), robotsTxt(robotsConfig)],
    prefetch: {
        prefetchAll: true,
        defaultStrategy: 'viewport'
    },
    image: {
        remotePatterns: [{ protocol: "https" }],
    }
});