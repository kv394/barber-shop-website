# Use a lightweight Python image
FROM python:3.12-slim

WORKDIR /app

# Install dependencies (minimal — no Antigravity SDK needed for server.py)
RUN pip install --no-cache-dir \
    fastapi>=0.115.0 \
    uvicorn>=0.30.0 \
    pg8000>=1.31.0 \
    pydantic>=2.0.0

# Copy server code
COPY server.py .

# Expose port for Cloud Run
ENV PORT=8080
EXPOSE 8080

# Run FastAPI server
CMD ["python", "server.py"]
