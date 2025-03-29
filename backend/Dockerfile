# Build the code
FROM mcr.microsoft.com/openjdk/jdk:21-ubuntu AS gradle-build

WORKDIR /opt/app
COPY src ./src
COPY gradle ./gradle
COPY gradlew settings.gradle.kts build.gradle.kts ./
RUN chmod +x ./gradlew
RUN --mount=type=cache,target=/root/.gradle ./gradlew --no-daemon -i  clean build -x test


# Create a custom Java runtime
FROM mcr.microsoft.com/openjdk/jdk:21-ubuntu AS jre-build

WORKDIR /opt/app
COPY --from=gradle-build /opt/app/build/libs/trip-trove-0.0.1-SNAPSHOT.jar ./
RUN jar xf trip-trove-0.0.1-SNAPSHOT.jar
RUN jdeps --ignore-missing-deps -q  \
    --recursive  \
    --multi-release 21  \
    --print-module-deps  \
    --class-path 'BOOT-INF/lib/*'  \
    trip-trove-0.0.1-SNAPSHOT.jar > deps.info
RUN jlink \
    --verbose \
    --add-modules $(cat deps.info) \
    --strip-debug \
    --compress 2 \
    --no-header-files \
    --no-man-pages \
    --output /customjre


# Continue with application deployment
FROM debian:buster-slim
ENV LANG en_US.UTF-8
ENV JAVA_HOME /usr/lib/jvm/msopenjdk-21-amd64
ENV PATH "${JAVA_HOME}/bin:${PATH}"
COPY --from=jre-build /customjre $JAVA_HOME

# Create a custom user with UID 1234 and GID 1234
RUN groupadd -g 1234 customgroup && \
    useradd -m -u 1234 -g customgroup customuser
USER customuser
WORKDIR /home/customuser
COPY --from=gradle-build /opt/app/build/libs/trip-trove-0.0.1-SNAPSHOT.jar ./
CMD ["java", "-jar", "trip-trove-0.0.1-SNAPSHOT.jar"]