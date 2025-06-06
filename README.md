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
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
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
    Create a `.env` file in the project root. This file is used by `docker-compose.yml` to supply environment variables to the application container.
    Add your Gemini API key to the `.env` file:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
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
