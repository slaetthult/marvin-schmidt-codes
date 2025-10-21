import { defineConfig } from 'astro/config';
import alpine from '@astrojs/alpinejs';
import mkcert from 'vite-plugin-mkcert'
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import robotsConfig from './robots-txt.config';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';

dotenv.config();

const isDev = import.meta.env.MODE === 'development';

let image = {
    remotePatterns: [{ protocol: "https" }]
};

if(!isDev){
    image = {
        service: {
            entrypoint: "./src/scripts/utils/cloudinary-image-service.ts",
            config: {
                cloudName: process.env.CLOUDINARY_CLOUD_NAME || import.meta.env.CLOUDINARY_CLOUD_NAME,
                baseTransforms: ["f_auto", "q_auto"],
                maxWidth: 2400
            }
        }
    }
}

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
    image: image
});