# ---- Stage 1: Build ----
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY .env ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy the rest of the application source code
COPY tsconfig.json .env ./
COPY src/ ./src/

# Compile the TypeScript code to Javascript
RUN npm run build

# ---- Stage 2: Production environment ----
FROM node:24-alpine AS runner

# Set environment to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files and environment files to the production root
COPY package.json package-lock.json* .env ./

# Install only production dependencies
# Sharp relies on native binaries that are built/fetched during install,
# so running `npm ci` strictly inside the alpine runner image guarantees
# compatibility with the Linux environment it will ultimately run in.
RUN npm ci --omit=dev && npm cache clean --force

# Copy the compiled output from the builder stage
COPY --from=builder /app/dist ./dist
COPY .env ./dist/.env

# Provide an initial structure for internal uploads generated at run-time
RUN mkdir -p internal_uploads && chown node:node internal_uploads

# We use the unprivileged `node` user to run the application securely
USER node

# Expose the default listening port
EXPOSE 3000

# Start up using standard Node
CMD ["npm", "start"]
