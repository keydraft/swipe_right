# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies to speed up subsequent builds
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the executable jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Configuration via Environment Variables
# The following values can be overridden by Render at runtime
ENV SPRING_PROFILES_ACTIVE=prod
ENV SERVER_PORT=8080

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
