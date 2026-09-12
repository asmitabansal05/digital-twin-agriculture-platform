#it creates one container containing everything the backend needs

FROM python:3.11-slim

WORKDIR /app

# Install Java 17
RUN apt-get update \
    && apt-get install -y openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Copy the complete repository
COPY . .

# Install Python dependencies required by ML
RUN pip install --no-cache-dir pandas scikit-learn joblib

# Build Spring Boot application
RUN chmod +x backend/mvnw
RUN cd backend && ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "backend/target/backend-0.0.1-SNAPSHOT.jar"]