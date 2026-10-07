# syntax=docker/dockerfile:1

FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle gradle
COPY src src
# Tests need Docker (Testcontainers), which a build has no access to: CI runs them instead.
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew bootJar --no-daemon -x test \
    && cp "$(find build/libs -name '*.jar' ! -name '*-plain.jar')" app.jar

FROM eclipse-temurin:21-jre
RUN groupadd --system lotline && useradd --system --gid lotline --no-create-home lotline
WORKDIR /app
COPY --from=build /workspace/app.jar app.jar
USER lotline
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
