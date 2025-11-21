FROM public.ecr.aws/lambda/python:3.13

# Install build dependencies
RUN dnf install -y gcc gcc-c++ && dnf clean all

# Copy requirements
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ${LAMBDA_TASK_ROOT}/

# Set the CMD to your handler
CMD [ "main.handler" ]

