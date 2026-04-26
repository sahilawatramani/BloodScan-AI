# ==============================================================================
# BloodScan AI - Backend Dockerfile for Hugging Face Spaces
# ==============================================================================
# This Dockerfile configures the isolated environment to run the FastAPI backend.
# Hugging Face Spaces (Docker deployment) expects the application to listen on 
# port 7860. Everything here is self-contained so it runs identically anywhere.
# ==============================================================================

# 1. Base Image: Use a lightweight, official Python 3.10 image.
FROM python:3.10-slim

# 2. Working Directory: Set the internal directory where commands will be run.
WORKDIR /app

# 3. System Dependencies: Install core libraries required for image processing.
# 'libgl1' and 'libglib2.0-0' prevent common errors when handling image streams.
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 4. Python Dependencies: Copy requirements first to leverage Docker layer caching.
COPY requirements.txt .

# Install Python packages. '--no-cache-dir' prevents saving downloaded zip files,
# keeping the final image size smaller.
RUN pip install --no-cache-dir -r requirements.txt

# 5. Application Code: Copy the rest of the backend files (app.py, models, etc.)
COPY . .

# 6. Port Configuration: Expose 7860, the default port expected by Hugging Face Spaces.
EXPOSE 7860

# 7. Startup Command: Launch the FastAPI application using Uvicorn.
# - host "0.0.0.0" allows the app to accept external connections.
# - port "7860" matches the exposed port above.
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
