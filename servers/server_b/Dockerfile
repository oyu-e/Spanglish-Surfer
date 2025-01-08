# Use Python 3.10 for server_b
FROM python:3.10

# Set working directory
WORKDIR /app

# Copy dependencies and install them
COPY requirements-b.txt .
RUN pip install --no-cache-dir -r requirements-b.txt

# Copy application code
COPY . .

# Expose the port your app runs on
EXPOSE 8081

# Run the server
CMD ["python", "server_b.py"]
