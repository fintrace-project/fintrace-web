# The dev stage runs Vite for the local stack (the workspace's docker-compose.local.yml), the working tree
# mounted over /app. The production stage — the build served as static files — arrives with 4.2d.
FROM node:22-bookworm-slim AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080", "--strictPort"]
