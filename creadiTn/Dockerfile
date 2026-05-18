# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
# Download dependencies first (cache layer)
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S creaditn && adduser -S creaditn -G creaditn

COPY --from=builder /app/target/creaditn-backend-*.jar app.jar

# Uploads directory (mount as volume in production)
RUN mkdir -p uploads/kyc uploads/profiles uploads/articles && chown -R creaditn:creaditn /app

USER creaditn

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
