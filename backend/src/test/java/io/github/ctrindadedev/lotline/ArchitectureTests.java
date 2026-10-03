package io.github.ctrindadedev.lotline;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/** Architecture rules, see ADR 0002. Plain unit tests: no Spring context, no database. */
class ArchitectureTests {

  private static final String BASE_PACKAGE = "io.github.ctrindadedev.lotline";

  private static final JavaClasses CLASSES =
      new ClassFileImporter()
          .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
          .importPackages(BASE_PACKAGE);

  @Test
  void modulesOnlyUseEachOthersPublicApi() {
    ApplicationModules.of(LotlineApplication.class).verify();
  }

  @Test
  void webLayerNeverTouchesPersistence() {
    noClasses()
        .that()
        .resideInAPackage(BASE_PACKAGE + "..web..")
        .should()
        .dependOnClassesThat()
        .resideInAPackage(BASE_PACKAGE + "..persistence..")
        .because("controllers go through the service layer and never expose entities")
        .allowEmptyShould(true)
        .check(CLASSES);
  }
}
