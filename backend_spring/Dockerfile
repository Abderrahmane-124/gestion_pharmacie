# Étape 1 : Build avec Maven + JDK 23
FROM eclipse-temurin:23-jdk AS build
WORKDIR /app

# Copier les fichiers Maven
COPY pom.xml .
RUN ./mvnw dependency:go-offline || true

# Copier le code source
COPY src ./src
COPY .mvn .mvn
COPY mvnw .

# Build le projet
RUN ./mvnw package -DskipTests

# Étape 2 : Exécution avec Java 23
FROM eclipse-temurin:23-jdk
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
