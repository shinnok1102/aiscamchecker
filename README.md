# Anti-Fraud Assistant

The Anti-Fraud Assistant is an AI-powered application designed to help users detect and prevent scams. It provides a user-friendly interface for interacting with a scam detection model, managing chat history, and customizing the user experience.

## Features

- **AI-Powered Scam Detection:** Leverages the Gemini API to analyze messages and identify potential scams.
- **User Authentication:** Secure user login and registration.
- **Chat History:** Stores and displays past conversations for easy reference.
- **Internationalization:** Supports multiple languages for a global user base.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js (assumed, will confirm in later steps)
- **API:** Gemini API

## API Key Configuration

The application requires a Gemini API Key to enable its core AI-powered scam detection features. The key is utilized in two ways depending on the environment:

-   **Local Development / Build Time:** During local development (`npm run dev`) or when building the application, Vite uses the `GEMINI_API_KEY` environment variable (typically from a `.env` file at the project root) to define `process.env.API_KEY` within the application code.
-   **Docker / Runtime:** When deployed using Docker, the API key is expected to be available at runtime as `window.APP_CONFIG.API_KEY`. This is typically achieved by passing the `GEMINI_API_KEY` (from the `.env` file used by Docker Compose, or other CI/CD variables) as an environment variable to the Docker container. An entrypoint script or similar mechanism within the container then makes this key accessible to the frontend application by assigning it to `window.APP_CONFIG.API_KEY`.

Ensure your API key is kept secure and is not committed directly into the repository.

## Run Locally

**Prerequisites:**

- Node.js (version X.X.X or higher)
- npm (version X.X.X or higher)
- Gemini API Key

**Local Setup:**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/anti-fraud-assistant.git
   cd anti-fraud-assistant
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   Create a `.env` file in the root directory (e.g., by copying `.env.example` if provided, or creating it new) and add your Gemini API key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```
   This key will be used by Vite to make it available as `process.env.API_KEY` in your application during local development.
4. **Run the application:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000` (or another port if specified).

## Run with Docker Compose

This is the recommended way to run the application for a consistent environment.

**Prerequisites:**

- Docker installed
- Docker Compose installed

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/anti-fraud-assistant.git
    cd anti-fraud-assistant
    ```
2.  **Create environment file:**
    Ensure you have a `.env` file in the project root (this is the same file used for local development). Docker Compose will use this file to supply the `GEMINI_API_KEY` as an environment variable to the application container.
    ```env
    GEMINI_API_KEY="your_api_key_here"
    ```
    Inside the container, this key is then made available to the frontend application via `window.APP_CONFIG.API_KEY`.
    **Note:** The `GEMINI_API_KEY` is crucial for the AI-powered scam detection features to work.

3.  **Build and run the container:**
    From the project root, run:
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker image (if it doesn't exist or if changes are detected) and then start the application container.

4.  **Access the application:**
    Open your web browser and navigate to `http://localhost:8080`.

## Contributing

We welcome contributions to the Anti-Fraud Assistant! If you'd like to contribute, please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for more information on how to get started.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
