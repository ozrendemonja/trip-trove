package com.triptrove.manager;

import io.hypersistence.utils.jdbc.validator.SQLStatementCountValidator;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import net.ttddyy.dsproxy.support.ProxyDataSourceBuilder;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.testcontainers.postgresql.PostgreSQLContainer;

import javax.sql.DataSource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(AbstractIntegrationTest.TestcontainersConfiguration.class)
public abstract class AbstractIntegrationTest {
    @Autowired
    protected EntityManager entityManager;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    protected void resetSqlStatementCounts() {
        entityManager.flush();
        entityManager.clear();
        entityManagerFactory.getCache().evictAll();
        SQLStatementCountValidator.reset();
    }

    @AfterEach
    void clearSqlStatementCounts() {
        SQLStatementCountValidator.reset();
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class TestcontainersConfiguration {
        @Bean
        static BeanPostProcessor countingDataSourcePostProcessor() {
            return new BeanPostProcessor() {
                @Override
                public Object postProcessAfterInitialization(Object bean, String beanName) {
                    if (bean instanceof DataSource dataSource) {
                        return ProxyDataSourceBuilder.create(dataSource)
                                .name(beanName)
                                .countQuery()
                                .build();
                    }
                    return bean;
                }
            };
        }

        @Bean
        @ServiceConnection
        PostgreSQLContainer postgres() {
            return new PostgreSQLContainer("postgres:17-alpine");
        }
    }
}