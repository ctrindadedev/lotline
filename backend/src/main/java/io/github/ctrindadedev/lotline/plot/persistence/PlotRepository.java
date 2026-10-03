package io.github.ctrindadedev.lotline.plot.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlotRepository extends JpaRepository<Plot, UUID> {}
