FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x backend/backend/mvnw
RUN cd backend/backend && ./mvnw clean package -DskipTests

EXPOSE 8080

ENTRYPOINT ["java", "-Xmx256m", "-Xss256k", "-jar", "backend/backend/target/backend-0.0.1-SNAPSHOT.jar"]