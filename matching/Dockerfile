FROM python:3.12

# Create app directory
WORKDIR /app

# Copy the entire directory structure
COPY knn/ /app/knn/
COPY pairing/ /app/pairing/
COPY matching.py foodflowcertificate.json requirements.txt /app/

# Install required Python packages
RUN pip install -r requirements.txt

# Make sure Python can find your packages
ENV PYTHONPATH=/app

ENV PORT 8080

# Add quotes around the module:app name
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 "matching:matching"