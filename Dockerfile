# Use the official Bun image as the base image
FROM oven/bun:1.3.11

# Install dependencies for native modules and libc compatibility
RUN apk add --no-cache libc6-compat

# Set the working directory inside the container
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -G appuser -S appuser

# Copy package files first for better caching
COPY --chown=1001:1001 package*.json bun.lock .snyk ./

# Set ownership of the app directory to the appuser
RUN chown -R 1001:1001 /app

# Switch to the non-root user
USER 1001

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY --chown=1001:1001 . .

# Build the application
RUN bun run build

# Set HOME environment variable for non-root user
ENV HOME=/app

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["bun", "public/index.js"]