# Use the official Node.js image as the base image
FROM node:25.6.1-alpine

# Install dependencies for native modules and libc compatibility
RUN apk add --no-cache libc6-compat

# Set the working directory inside the container
WORKDIR /app

# Update npm to stable version
RUN npm install -g npm@11.9.0

# Install corepack (not included by default in Node.js v25 Alpine)
RUN npm install -g corepack --force

# Enable Corepack and prepare Yarn version
RUN corepack enable && corepack prepare yarn@4.10.3 --activate

# Create a non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -G appuser -S appuser

# Copy package files first for better caching
COPY --chown=1001:1001 package*.json yarn.lock .yarnrc.yml ./

# Set ownership of the app directory to the appuser
RUN chown -R 1001:1001 /app

# Switch to the non-root user
USER 1001

# Install dependencies
RUN yarn install --immutable

# Copy the rest of the application code
COPY --chown=1001:1001 . .

# Build the application
RUN yarn build

# Set HOME environment variable to fix corepack cache issues
ENV HOME=/app

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "public/index.js"]
