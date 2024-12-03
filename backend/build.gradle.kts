plugins {
	java
	id("org.springframework.boot") version "3.4.0"
	id("io.spring.dependency-management") version "1.1.6"
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
	implementation("org.springframework.boot:spring-boot-starter-web"){
		exclude(module = "spring-boot-starter-logging")
	}
	implementation("org.springframework.boot:spring-boot-starter-log4j2:3.4.0")
	implementation("org.hibernate:hibernate-validator:8.0.1.Final")
	testImplementation("org.springframework.boot:spring-boot-starter-test"){
		exclude(module = "spring-boot-starter-logging")
	}
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	compileOnly("org.projectlombok:lombok:1.18.36")
	annotationProcessor("org.projectlombok:lombok:1.18.36")
}

tasks.withType<Test> {
	useJUnitPlatform()
}
