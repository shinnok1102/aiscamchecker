#!/bin/sh
set -e

# Default API key if not set, though it should be set via docker-compose
API_KEY=${GEMINI_API_KEY:-"RUNTIME_API_KEY_NOT_SET"}

# Create the config.js file
# This path should match where Nginx expects to find it and where index.html references it.
CONFIG_FILE_PATH="/usr/share/nginx/html/config.js"

echo "window.APP_CONFIG = {" > ${CONFIG_FILE_PATH}
echo "  API_KEY: \"${API_KEY}\"" >> ${CONFIG_FILE_PATH}
echo "};" >> ${CONFIG_FILE_PATH}

echo "Generated ${CONFIG_FILE_PATH} with API_KEY."

# Execute the CMD from the Dockerfile (i.e., nginx -g 'daemon off;')
exec "$@"
