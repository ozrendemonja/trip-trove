plugins {
    java
    id("org.springframework.boot") version "3.4.0"
    id("io.spring.dependency-management") version "1.1.6"
    id("org.springdoc.openapi-gradle-plugin") version "1.9.0"
    id("org.sonarqube") version "3.5.0.2730"
}

group = "com.triptrove"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web") {
        exclude(module = "spring-boot-starter-logging")
    }
    implementation("org.springframework.boot:spring-boot-starter-log4j2:3.4.0")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa") {
        exclude(module = "spring-boot-starter-logging")
    }
    implementation("org.postgresql:postgresql:42.7.5")
    implementation("org.hibernate:hibernate-validator:8.0.1.Final")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.7.0")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.18.2")
    testImplementation("org.springframework.boot:spring-boot-starter-test") {
        exclude(module = "spring-boot-starter-logging")
    }
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:junit-jupiter")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    compileOnly("org.projectlombok:lombok:1.18.36")
    annotationProcessor("org.projectlombok:lombok:1.18.36")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
