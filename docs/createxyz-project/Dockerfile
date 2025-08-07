FROM node:20-slim
ENV CI=false
ENV VITE_DEV_CACHE=.vite/deps
WORKDIR /home/user

RUN npm install -g bun

COPY --link apps ./apps
COPY --link bun.lock package.json ./

WORKDIR /home/user/apps/web
RUN bun install --frozen-lockfile

WORKDIR /home/user/apps/mobile  
RUN bun install --frozen-lockfile

WORKDIR /home/user