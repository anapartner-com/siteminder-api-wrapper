# Development container
FROM node:20-alpine

WORKDIR /app

# Install development tools
RUN apk add --no-cache git bash

# Copy package files
COPY package.json ./
COPY tsconfig.json ./
COPY nodemon.json ./
COPY public-openapi.json ./

# Install all dependencies
RUN npm install -g nodemon ts-node && \
    npm install

# Note: When using with VS Code dev container:
# - The entire workspace will be mounted at /app, overwriting these files
# - This ensures live reloading works with your local changes

# Create non-root user
#RUN addgroup -g 1000 -S nodejs && \
#    adduser -S nodejs -u 1000

# Change ownership
#RUN chown -R nodejs:nodejs /app
RUN chown -R node:node /app

# Switch to non-root user
#USER nodejs
USER node

# Set the working directory for the user
WORKDIR /app

# Expose port
EXPOSE 3000

# Health check - uses PORT env var, defaults to 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const port=process.env.PORT||3000;require('http').get('http://localhost:'+port+'/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

# Start application in development mode with hot reloading
CMD ["npm", "run", "dev"]
