# ---------- Builder Stage ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of your source code
COPY . .

# Remove dev dependencies to reduce size
RUN npm prune --production

# ---------- Production Stage ----------
FROM node:18-alpine AS production

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy only the pruned, production-ready application from the builder
COPY --from=builder /app .

# Expose the port your app listens on (5000)
EXPOSE 5000

# Start your Express server
CMD ["npm", "start"]
