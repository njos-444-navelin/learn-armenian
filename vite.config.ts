import adapter from '@sveltejs/adapter-auto';
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

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		}),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Learn Armenian',
				short_name: 'Learn Armenian',
				description: 'Learn Armenian',
				lang: 'hy',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				theme_color: '#0033a0',
				background_color: '#ffffff',
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
				globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}']
			}
		})
	]
});
