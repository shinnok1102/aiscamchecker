# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package.json ./
# If package-lock.json or npm-shrinkwrap.json exists, copy it too
# COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration file
# This file will be created in a subsequent step.
# For now, we'll assume it will be at nginx/nginx.conf in the Docker build context
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy and set up entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
# CMD will be passed to the entrypoint
CMD ["nginx", "-g", "daemon off;"]
