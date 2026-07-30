FROM node:20-slim

WORKDIR /app

# Install root dependencies (includes vite for build)
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build frontend
COPY . .
RUN npx vite build

# Install server dependencies (better-sqlite3 needs native build)
WORKDIR /app/server
RUN npm install

WORKDIR /app
# Host platforms (Render/Zeabur) inject PORT at runtime; the server reads
# process.env.PORT and falls back to 3001 locally. EXPOSE is documentation only.
EXPOSE 8080
CMD ["node", "server/server.js"]
