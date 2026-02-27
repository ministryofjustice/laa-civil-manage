# Use the official Node.js image as the build image
FROM node:25.11.0-alpine3.23 AS build-image

# Set the working directory inside the container
WORKDIR /app

# Copy the application code to the working directory
# and set ownership to the non-root user
COPY . .

# Force install of corepack (necessary with node >=v25.0.0)
RUN npm install -g corepack --force

# Enable Corepack to use the correct Yarn version
RUN corepack enable

# Install dependencies
RUN yarn install --immutable

# Ensure the .env file exists
RUN if [ ! -f ".env" ]; then touch /app/.env; fi

# Build the application
RUN yarn build

# ================================================== #
# ============= Build the run image ================ #
# ================================================== #
FROM node:25.11.0-alpine3.23 AS run-image

# Set the working directory inside the container
WORKDIR /app

# Copy the package information and configuration files
COPY --from=build-image /app/package*.json /app/
COPY --from=build-image /app/.yarnrc.yml /app/
COPY --from=build-image /app/yarn.lock /app/
COPY --from=build-image /app/.snyk /app/

# See the build image stage - this is created empty if it does not exist.
# If running from a dev environment it will have been copied from the dev environment.
COPY --from=build-image /app/.env /app/

# Copy the compiled application code to the working directory
COPY --from=build-image /app/public /app/public
COPY --from=build-image /app/views /app/views /app/
# TODO Probably want to move views into /src

# Force install of corepack (necessary with node >=v25.0.0)
RUN npm install -g corepack --force

# Enable Corepack to use the correct Yarn version
RUN corepack enable

# Install only production dependencies
RUN yarn workspaces focus --all --production

# Create a non-root user  
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 -G appuser appuser

RUN chown -R 1001:1001 /app
# Switch to the non-root user by ID (not name)
USER 1001

# Set HOME environment variable to fix corepack cache issues
ENV HOME=/app

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "public/index.js"]
