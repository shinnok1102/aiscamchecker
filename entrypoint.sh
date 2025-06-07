#!/bin/sh
set -e # Exit immediately if a command exits with a non-zero status.

echo "[Entrypoint] Script started."
echo "[Entrypoint] GEMINI_API_KEY is: '${GEMINI_API_KEY}'" # Print the env var

# Target directory and file
TARGET_DIR="/usr/share/nginx/html"
CONFIG_FILE_PATH="${TARGET_DIR}/config.js"

echo "[Entrypoint] Target directory for config.js: ${TARGET_DIR}"
echo "[Entrypoint] Listing contents of ${TARGET_DIR} BEFORE creating config.js:"
ls -la "${TARGET_DIR}" || echo "[Entrypoint] Failed to list ${TARGET_DIR} or directory does not exist yet."

echo "[Entrypoint] Checking write permissions for ${TARGET_DIR} by attempting to create a test file."
touch "${TARGET_DIR}/.entrypoint_can_write_test" && echo "[Entrypoint] Write test successful." || echo "[Entrypoint] Write test FAILED for ${TARGET_DIR}."
rm -f "${TARGET_DIR}/.entrypoint_can_write_test"

# Default API key if not set
API_KEY=${GEMINI_API_KEY:-"RUNTIME_API_KEY_NOT_SET_BY_ENTRYPOINT"}

echo "[Entrypoint] Creating ${CONFIG_FILE_PATH} with API_KEY: '${API_KEY}'"
# Create the config.js file
# Using cat with EOF for heredoc allows for cleaner multiline echo
cat <<EOF > ${CONFIG_FILE_PATH}
window.APP_CONFIG = {
  API_KEY: "${API_KEY}"
};
EOF

if [ -f "${CONFIG_FILE_PATH}" ]; then
  echo "[Entrypoint] Successfully created ${CONFIG_FILE_PATH}."
  echo "[Entrypoint] Contents of ${CONFIG_FILE_PATH}:"
  cat "${CONFIG_FILE_PATH}"
else
  echo "[Entrypoint] FAILED to create ${CONFIG_FILE_PATH}."
fi

echo "[Entrypoint] Listing contents of ${TARGET_DIR} AFTER creating config.js:"
ls -la "${TARGET_DIR}" || echo "[Entrypoint] Failed to list ${TARGET_DIR} after config.js attempt."

echo "[Entrypoint] Handing over to CMD: $@"
# Execute the CMD from the Dockerfile (e.g., nginx -g 'daemon off;')
exec "$@"
