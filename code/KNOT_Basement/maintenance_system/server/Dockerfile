# Use official lightweight Node.js 18 Alpine base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy server code
COPY . .

# Expose maintenance backend port
EXPOSE 5003

# Environment defaults
ENV PORT=5003
ENV NODE_ENV=production

# Start Maintenance Backend server
CMD ["node", "server.js"]
