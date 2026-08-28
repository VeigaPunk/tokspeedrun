FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# Install deps (npm install: lockfile intentionally not committed — see README)
COPY package.json ./
RUN npm install

# Build frontend bundle + server bundle
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
