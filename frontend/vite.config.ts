import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const projectRoot = dirname;

const realProjectRoot = 
	"K:/OneDrive - NEXTEER AUTOMOTIVE/Inprocessing/Project/Python/ai_sql_assistant/frontend";

export default defineConfig({
	root: projectRoot,

	plugins: [react()],

	resolve: {
		preserveSymlinks: true,
	},

	cacheDir: path.resolve(
		projectRoot,
		"node_modules/.vite",
	),

	server: {
		fs: {
			strict: true,
			allow: [
				projectRoot,
				realProjectRoot,
			],
		},

			watch: {
				usePolling: true,
				interval: 300,
			},
		},
	});


