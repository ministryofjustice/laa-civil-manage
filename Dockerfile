# Use the official Bun image as the base image
FROM oven/bun:1.3.14-alpine@sha256:5acc90a93e91ff07bf72aa90a7c9f0fa189765aec90b47bdbf2152d2196383c0

# Install dependencies for native modules and libc compatibility
RUN apk add --no-cache libc6-compat

# Set the working directory inside the container
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -G appuser -S appuser

# Copy package files first for better caching
COPY --chown=1001:1001 package*.json bun.lock .snyk ./
COPY --chown=1001:1001 patches/ ./patches/

# Set ownership of the app directory to the appuser
RUN chown -R 1001:1001 /app

# Switch to the non-root user
USER 1001

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY --chown=1001:1001 . .

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Build the application
RUN bun run build

# Set HOME environment variable for non-root user
ENV HOME=/app

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["bun", "public/index.js"]