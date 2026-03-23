import { defineConfig } from 'astro/config';
import alpine from '@astrojs/alpinejs';
import mkcert from 'vite-plugin-mkcert'
import sitemap from '@astrojs/sitemap';
import robotsTxt from 'astro-robots-txt';
import robotsConfig from './robots-txt.config';
import tailwindcss from '@tailwindcss/vite';
import dotenv from 'dotenv';
import { defineConfig } from 'astro/config';
import { storyblok } from '@storyblok/astro';
import { loadEnv } from 'vite';
const env = loadEnv('', process.cwd(), 'STORYBLOK');
const { STORYBLOK_DELIVERY_API_TOKEN } = loadEnv(
    import.meta.env.MODE,
    process.cwd(),
    '',
);
dotenv.config();

// https://astro.build/config
export default defineConfig({
    site: process.env.PUBLIC_PAGE_URL,
    vite: {
        plugins: [mkcert(), tailwindcss()],
        server: {
            https: true
        },
        build: {
            target: 'es2019'
        }
    },
    integrations: [alpine(), sitemap(), robotsTxt(robotsConfig),
        storyblok({
            accessToken: env.STORYBLOK_DELIVERY_API_TOKEN,
            apiOptions: {
                region: 'eu',
            },
            components: {
                page: 'storyblok/components/base/Page',
                heroIntro: 'storyblok/components/modules/HeroIntro',
            },
        })

    ],
    prefetch: {
        prefetchAll: true,
        defaultStrategy: 'viewport'
    },
    image: {
        service: {
            entrypoint: "./src/scripts/utils/cloudinary-image-service.ts",
            config: {
                cloudName: process.env.CLOUDINARY_CLOUD_NAME || import.meta.env.CLOUDINARY_CLOUD_NAME,
                baseTransforms: ["f_auto", "q_auto"],
                maxWidth: 2400
            }
        }
    }
});