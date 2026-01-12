import type { RobotsTxtOptions } from 'astro-robots-txt';

const robotsConfig: RobotsTxtOptions = {
    policy: [
        {
            userAgent: '*',
            disallow: [
                '/nachricht-verschickt'
            ]
        }
    ],
    sitemapBaseFileName: 'sitemap-index' // default 'sitemap-index'
};

export default robotsConfig;
