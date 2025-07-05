FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy package definition first to leverage docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Launch
CMD ["node", "index.js"]
