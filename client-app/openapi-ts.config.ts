import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    client: '@hey-api/client-fetch',
    input: 'openapi-doc/api-docs.json',
    output: {
        format: 'prettier',
        lint: 'eslint',
        path: 'src/clients/manager',
    },
});