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
			// SvelteKit defaults Vite's `base` to './', but vite-plugin-pwa reuses that
			// verbatim for the service worker's registration URL and scope, which then
			// resolve against the current page and 404 from any nested route. Force an
			// absolute base so the SW always registers at the site root.
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
				// Defaults to '/', registering an offline navigation fallback bound to it.
				// This app is fully SSR, so nothing is ever precached under '/' and the
				// handler threw "non-precached-url" on every navigation.
				navigateFallback: null
			}
		})
	]
});
