#!/bin/bash
set -e

echo "🔨 Building Lambda package with Docker..."

# Clean previous builds
rm -rf dist package lambda.zip

# Create package directory
mkdir -p package

# Use Docker to install dependencies for lambda environment
echo "📦 Installing dependencies with Docker (linux/amd64)..."
docker run --platform linux/amd64 --rm \
  -v $(pwd):/var/task \
  -w /var/task \
  --entrypoint /bin/bash \
  public.ecr.aws/lambda/python:3.13 \
  -c "pip install -r requirements.txt -t package/ --no-cache-dir"

# Copy source code to package
echo "📂 Copying source code..."
cp -r src/* package/

# Create ZIP file
echo "🗜️  Creating lambda.zip..."
cd package
zip -r ../lambda.zip . -q
cd ..

# Cleanup
echo "🧹 Cleaning up..."
rm -rf package

echo "✅ Lambda package created: lambda.zip ($(du -h lambda.zip | cut -f1))"

