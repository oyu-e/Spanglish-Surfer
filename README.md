# Spanglish Surfer

Spanglish Surfer is a Google Chrome extension designed to enhance casual language acquisition by translating random words on web pages into Spanish. It’s a great tool for anyone looking to immerse themselves in a language-learning experience while browsing the internet.

# Frontend: React Chrome Extension

## Prerequisites
- Node.js and npm installed.

## How to Run Locally
Navigate to the frontend directory:

```bash
cd react-chrome-extension
```

```bash
npm install
```

## Start the development server:

```bash
npm start
```


Open http://localhost:3000 in your browser to view the application.

## Build for Production
To create a production build:


```bash
npm run build
```
The build folder will be optimized for deployment.

# Backend: Flask Servers
The backend consists of two servers, each with its own dependencies.

## Prerequisites
- Python 3.x installed.
- Docker installed if using Docker.


## How to Run Locally Without Docker
Install dependencies in two separate virtual environment:

```bash
pip install -r requirements_a.txt
```
```bash
pip install -r requirements_b.txt
```

Install the Spanish language model for spaCy:
```bash
python3 -m spacy download es_core_news_sm
```

Validate spaCy installation:
```bash
python3 -m spacy validate
```

Run the servers:
```bash
python3 server_a.py
```
```bash
python3 server_b.py
```

## Run Using Docker
Build Docker images:

```bash
docker build -t server_a-image -f servers/server_a/Dockerfile servers/server_a
docker build -t server_b-image -f servers/server_b/Dockerfile servers/server_b
```

Run servers using docker-compose.yml:
```bash
docker-compose up
```

If there are changes to the Dockerfiles, rebuild and run:

```bash
docker-compose up --build
```

The app can be deployed using Render with the provided render.yaml configuration file.

# Troubleshooting Render Deployment

Ensure all services defined in render.yaml are correctly set up in your Render dashboard.
Check Render logs for deployment errors and fix any issues with dependencies or configurations.
If deployment fails, verify Dockerfile compatibility with Render's runtime.
