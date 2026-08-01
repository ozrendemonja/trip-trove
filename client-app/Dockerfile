# Build Stage
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile
COPY index.html .
COPY vite.config.ts .
COPY ./src ./src
COPY tsconfig.json . 
# RUN yarn test-unit && yarn test-storybook
RUN yarn build
 
# # Production Stage
FROM nginx:1.27.4-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
CMD ["nginx", "-g", "daemon off;"]