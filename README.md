# Learn Armenian

A SvelteKit PWA, scaffolded with [`sv`](https://github.com/sveltejs/cli) and [`@vite-pwa/sveltekit`](https://github.com/vite-pwa/sveltekit).

PWA features (manifest link, service worker) only activate in the production build/preview — `vite dev` intentionally skips them so HMR isn't disrupted.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
