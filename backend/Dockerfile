# Build the code
FROM mcr.microsoft.com/openjdk/jdk:25-ubuntu AS gradle-build

WORKDIR /opt/app
COPY src ./src
COPY gradle ./gradle
COPY gradlew settings.gradle.kts build.gradle.kts ./
RUN chmod +x ./gradlew
RUN --mount=type=cache,target=/root/.gradle ./gradlew --no-daemon -i  clean build -x test


# Create a custom Java runtime
FROM mcr.microsoft.com/openjdk/jdk:25-ubuntu AS jre-build

WORKDIR /opt/app
COPY --from=gradle-build /opt/app/build/libs/trip-trove-0.0.1-SNAPSHOT.jar ./
RUN jar xf trip-trove-0.0.1-SNAPSHOT.jar
RUN jdeps --ignore-missing-deps -q  \
    --recursive  \
    --multi-release 25  \
    --print-module-deps  \
    --class-path 'BOOT-INF/lib/*'  \
    trip-trove-0.0.1-SNAPSHOT.jar > deps.info
RUN jlink \
    --verbose \
    --add-modules $(cat deps.info) \
    --strip-debug \
    --compress=zip-9 \
    --dedup-legal-notices=error-if-not-same-content \
    --no-header-files \
    --no-man-pages \
    --output /customjre


# Continue with application deployment
FROM gcr.io/distroless/java-base-debian13:nonroot
ENV LANG=C.UTF-8
ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"
COPY --from=jre-build /customjre $JAVA_HOME

WORKDIR /home/nonroot
COPY --chown=nonroot:nonroot --from=gradle-build /opt/app/build/libs/trip-trove-0.0.1-SNAPSHOT.jar ./
CMD ["java", "-jar", "trip-trove-0.0.1-SNAPSHOT.jar"]