# Start from the official Nginx image
FROM nginx:alpine

# Remove any default files that might be in our way
RUN rm -rf /usr/share/nginx/html/*

# Copy the dist folder to Nginx's serve directory
COPY ./dist /usr/share/nginx/html