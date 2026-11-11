# The dev stage runs Vite for the local stack (the workspace's docker-compose.local.yml), the working tree
# mounted over /app. The production stage, the default target, serves the build as static files.
# Both bases pinned by digest so a base update is a commit, and an unchanged release still rebuilds for it
# (§7.8); Dependabot moves the digests
FROM node:22-bookworm-slim@sha256:18052396bf1d0c6e0a8c58181b5c1457da19409efbd5032a3f4d86974e74d13c AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080", "--strictPort"]

FROM dev AS build
RUN npm run build \
 && rm -r dist/.vite \
 && find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' \) -exec gzip -9 -k {} +

# Unprivileged: runs as a non-root user and listens on 8080, the port BFF_WEB_URL names
FROM nginxinc/nginx-unprivileged:1.31.7-alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
