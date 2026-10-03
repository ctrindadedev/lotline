package io.github.ctrindadedev.lotline;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Full application context against a real PostGIS container. Tests using this annotation without
 * extra context customization share one cached context, and therefore one container.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@SpringBootTest
@Import(TestcontainersConfiguration.class)
public @interface IntegrationTest {}
