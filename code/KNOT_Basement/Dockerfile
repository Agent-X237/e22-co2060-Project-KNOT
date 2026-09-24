# Use Node.js 18 Alpine base image
FROM node:18-alpine

WORKDIR /app

# Copy root package configurations
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose Gateway Hub port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Run Gateway Server
CMD ["node", "gateway_server.js"]
