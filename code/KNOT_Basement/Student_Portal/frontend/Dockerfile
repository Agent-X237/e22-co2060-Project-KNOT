# Stage 1: Build React SPA application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and build production bundle
COPY . .
ARG VITE_API_URL=https://backend.knotpdn.tech
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with lightweight Nginx web server
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
