# First stage: Node image to build the project
FROM node:18 as build-stage

# Set the working directory
WORKDIR /app

# Copy package.json and yarn.lock files to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of your source code to the working directory
COPY . .

# Build the project
RUN yarn build

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
