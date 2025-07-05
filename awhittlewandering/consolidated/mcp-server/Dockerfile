FROM node:18-slim

WORKDIR /app

# Copy package files for efficient layer caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create data directory for persistence
RUN mkdir -p /app/data

EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3100/api/status || exit 1

CMD ["npm", "start"]
