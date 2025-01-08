# Use Python 3.12.4 for server_a
FROM python:3.12.4

# Set working directory
WORKDIR /app

# Copy dependencies and install them
COPY requirements-a.txt .
RUN pip install --no-cache-dir -r requirements-a.txt

# Copy application code
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Run the server
CMD ["python", "server_a.py"]
