# Dockerfile for the Node.js backend server

# --- Base Stage ---
# Use an official Node.js runtime as a parent image
# Choose a version that matches your development environment (e.g., LTS version like 18 or 20)
FROM node:20-slim AS base

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# --- Dependencies Stage ---
# Install app dependencies using a separate stage to leverage Docker cache
FROM base AS dependencies
# Install dependencies including devDependencies if tests or build steps are run here
# For production, you might do a separate `npm ci --omit=dev` in a later stage
RUN npm install --verbose
# If you have a build step (e.g., for TypeScript), you would run it here:
# RUN npm run build

# --- Production Stage ---
# Create a new stage for the production image from the base stage
# This helps keep the production image smaller by not including build tools or devDependencies
FROM base AS production

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy only necessary files from the dependencies stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=dependencies /usr/src/app/package.json ./package.json
# If you had a build step, you'd copy the build output:
# COPY --from=dependencies /usr/src/app/dist ./dist

# Copy the rest of the application code
COPY . .
# If you had a build step and your src files are not needed at runtime, you might adjust this.
# For this project, src/ is needed as it's plain JavaScript.

# Expose the port the app runs on
# This should match the PORT environment variable your app uses (defaulting to 5000 in server.js)
EXPOSE 5000

# Command to run the application
# This should match your package.json "start" script if it's production-ready,
# or directly call node.
# Using an array makes it the preferred exec form.
CMD [ "node", "src/server.js" ]

# If using PM2 for process management in production (recommended):
# 1. Install PM2 globally in this stage or add it as a dependency:
#    RUN npm install pm2 -g
# 2. Copy your ecosystem.config.js file:
#    COPY ecosystem.config.js .
# 3. Change CMD to use PM2:
#    CMD [ "pm2-runtime", "start", "ecosystem.config.js" ]
# Note: `pm2-runtime` is designed for containers, `pm2 start` is for VMs/bare metal.

# Healthcheck (Optional, but good practice for some orchestrators)
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:5000/ || exit 1
# (Adjust the / path if you have a dedicated health check endpoint like /api/health)
