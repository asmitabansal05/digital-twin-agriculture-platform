# Java 17 base image
FROM eclipse-temurin:17-jdk

WORKDIR /app

# Install Python
RUN apt-get update \
    && apt-get install -y python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Copy complete repository
COPY . .

# Install Python ML dependencies
RUN pip3 install --break-system-packages --no-cache-dir pandas scikit-learn joblib

# Build Spring Boot application
RUN chmod +x backend/backend/mvnw
RUN cd backend/backend && ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "backend/backend/target/backend-0.0.1-SNAPSHOT.jar"]