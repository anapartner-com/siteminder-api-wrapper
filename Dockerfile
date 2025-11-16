# Development container
FROM node:20-alpine

WORKDIR /app

# Install development tools
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY src ./src

# Copy any other necessary files
COPY .env* ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check - uses PORT env var, defaults to 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "const port=process.env.PORT||3000;require('http').get('http://localhost:'+port+'/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

# Start application in development mode with hot reloading
CMD ["npm", "run", "dev"]
