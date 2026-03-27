import { fileURLToPath } from 'node:url';

import type { AstroIntegration } from 'astro';

export default function membership(): AstroIntegration {
  return {
    name: 'space-coast-membership',

    hooks: {
      'astro:config:setup': ({ injectRoute, logger, updateConfig }) => {
        const log = logger.fork('membership');

        // Expose plugin files under the `#membership` import alias so that
        // host-app components (e.g. LatestMembers, PageLayout) can import
        // shared lib modules and components without hard-coding vendor paths.
        updateConfig({
          vite: {
            resolve: {
              alias: [
                {
                  find: '#membership',
                  replacement: fileURLToPath(new URL('./', import.meta.url)),
                },
              ],
            },
          },
        });

        const base = new URL('./routes/', import.meta.url);

        const routes: Array<{ pattern: string; file: string }> = [
          { pattern: '/api/auth/login', file: 'api/auth/login.ts' },
          { pattern: '/api/auth/callback', file: 'api/auth/callback.ts' },
          { pattern: '/api/auth/logout', file: 'api/auth/logout.ts' },
          { pattern: '/api/auth/send-verification', file: 'api/auth/send-verification.ts' },
          { pattern: '/api/auth/verify-code', file: 'api/auth/verify-code.ts' },
          { pattern: '/api/profile', file: 'api/profile.ts' },
          { pattern: '/api/skills', file: 'api/skills.ts' },
          { pattern: '/members', file: 'members/index.astro' },
          { pattern: '/members/[id]', file: 'members/[id].astro' },
          { pattern: '/profile', file: 'profile/index.astro' },
          { pattern: '/verify-email', file: 'verify-email/index.astro' },
          { pattern: '/verify-email/check', file: 'verify-email/check.astro' },
        ];

        for (const route of routes) {
          injectRoute({
            pattern: route.pattern,
            entrypoint: fileURLToPath(new URL(route.file, base)),
            prerender: false,
          });
        }

        log.info('Membership routes registered.');
      },
    },
  };
}
