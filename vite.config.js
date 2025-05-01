import { defineConfig } from "vite";

export default defineConfig({
    server: {
        allowedHosts: [
            "example.com",
            "localhost",
            "f61ef805-a5ce-46c1-a1db-23665a76b034-00-2stxqhl2sxfgh.picard.replit.dev",
        ],
    },
});
