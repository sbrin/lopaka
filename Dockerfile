# First stage: Node image to build the project
FROM node:22 as build-stage

# Set the working directory
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy the rest of your source code to the working directory
COPY . .

# Build the project
ENV NODE_OPTIONS='--max-old-space-size=16384'
RUN pnpm build

# Second stage: Start from the official Nginx image
FROM nginx:alpine

# Remove any default files
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output from the first stage to Nginx's serve directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx when the container has provisioned
CMD ["nginx", "-g", "daemon off;"]
