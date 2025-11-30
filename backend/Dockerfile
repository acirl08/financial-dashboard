FROM python:3.11-slim

WORKDIR /app

# Force rebuild - v2
ARG CACHEBUST=2

# Install dependencies (copy from backend folder since build context is root)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code from backend folder
COPY backend/app ./app

# Use PORT environment variable from Railway
ENV PORT=8000
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
