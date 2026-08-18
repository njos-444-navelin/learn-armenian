import adapter from '@sveltejs/adapter-netlify';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter()
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			// SvelteKit defaults Vite's `base` to a relative './' so the build is
			// portable across subpaths — but vite-plugin-pwa reuses that same
			// value verbatim for the service worker's own registration URL and
			// scope, which isn't page-depth-aware like SvelteKit's asset links
			// are. That made the SW register as './sw.js' with scope './', which
			// resolves relative to the *current page*, so it 404s from any route
			// nested more than one segment deep (e.g. /en/learn). Force an
			// absolute base here so the SW always registers at the site root.
			base: '/',
			manifest: {
				name: 'Learn Armenian',
				short_name: 'Learn Armenian',
				description: 'Learn Armenian from English or Russian',
				lang: 'en',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#c67139',
				background_color: '#f5ead8',
				icons: [
					{
						src: 'icons/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'icons/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: 'icons/maskable-icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
				// @vite-pwa/sveltekit defaults this to '/' when unset, registering an
				// offline navigation fallback bound to that URL. This app is fully
				// SSR (no prerendered HTML, so nothing ever gets precached under
				// '/'), which made that fallback handler throw "non-precached-url"
				// on every navigation. There's no static shell to fall back to, so
				// disable it explicitly rather than point it at a URL that can never
				// actually be precached.
				navigateFallback: null
			}
		})
	]
});
