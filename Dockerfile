# Use the official lightweight NGINX image
# https://hub.docker.com/_/nginx
FROM nginx:1.25-alpine

# Remove any default files that might be in our way
RUN rm -rf /usr/share/nginx/html/*

# Copy our static HTML and CSS files
COPY . /usr/share/nginx/html

# NGINX will start by default
