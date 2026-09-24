# Use official lightweight Node.js 18 Alpine base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json files first for efficient caching
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy remaining backend source code and database initialization script
COPY . .
COPY ../database/setup_db.js ./database/setup_db.js

# Expose backend API port
EXPOSE 5001

# Environment variables default fallback
ENV PORT=5001
ENV NODE_ENV=production

# Startup command: run database migration then start server
CMD ["sh", "-c", "node database/setup_db.js || true && node server.js"]
