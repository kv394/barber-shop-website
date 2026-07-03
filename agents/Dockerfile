# Use a lightweight Python image
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy agent code
COPY bi_agent.py .

# Expose port for Cloud Run
ENV PORT=8080
EXPOSE 8080

# Run FastAPI server
CMD ["python", "-c", "import uvicorn; from bi_agent import create_app; uvicorn.run(create_app(), host='0.0.0.0', port=8080)"]
