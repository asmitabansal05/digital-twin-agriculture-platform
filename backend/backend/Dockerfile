FROM eclipse-temurin:17-jdk

WORKDIR /app

ENV JAVA_TOOL_OPTIONS="-Xmx256m -Xss256k"

COPY . .

RUN chmod +x backend/backend/mvnw
RUN cd backend/backend && ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "backend/backend/target/backend-0.0.1-SNAPSHOT.jar"]2`1