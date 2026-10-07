package io.github.ctrindadedev.lotline.plot.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.ctrindadedev.lotline.plot.PlotStatus;
import io.github.ctrindadedev.lotline.plot.exception.OwnPlotReservationException;
import io.github.ctrindadedev.lotline.plot.exception.PlotNotOwnedException;
import io.github.ctrindadedev.lotline.plot.exception.PlotStatusConflictException;
import io.github.ctrindadedev.lotline.plot.exception.ReservationNotYoursException;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** The plot's status machine, without a database. See ADR 0021. */
class PlotTransitionsTests {

  private final UUID seller = UUID.randomUUID();
  private final UUID buyer = UUID.randomUUID();
  private final UUID someoneElse = UUID.randomUUID();
  private final Plot plot = new Plot(null, BigDecimal.TEN, "A plot", "seller@example.com", seller);

  @Test
  void startsAvailable() {
    assertThat(plot.getStatus()).isEqualTo(PlotStatus.AVAILABLE);
    assertThat(plot.getBuyerId()).isNull();
  }

  @Test
  void goesFromAvailableToReservedToSold() {
    plot.reserve(buyer);
    assertThat(plot.getStatus()).isEqualTo(PlotStatus.RESERVED);
    assertThat(plot.getBuyerId()).isEqualTo(buyer);

    plot.sell(seller);
    assertThat(plot.getStatus()).isEqualTo(PlotStatus.SOLD);
    assertThat(plot.getBuyerId()).isEqualTo(buyer);
  }

  @Test
  void goesBackToAvailableWhenTheSellerOrTheBuyerReleasesIt() {
    plot.reserve(buyer);
    plot.release(buyer);
    assertThat(plot.getStatus()).isEqualTo(PlotStatus.AVAILABLE);
    assertThat(plot.getBuyerId()).isNull();

    plot.reserve(buyer);
    plot.release(seller);
    assertThat(plot.getStatus()).isEqualTo(PlotStatus.AVAILABLE);
  }

  @Test
  void neverLetsTheSellerReserveTheirOwnPlot() {
    assertThatThrownBy(() -> plot.reserve(seller)).isInstanceOf(OwnPlotReservationException.class);
  }

  @Test
  void refusesReservingAPlotWithoutASeller() {
    Plot unowned = new Plot(null, BigDecimal.TEN, "A plot", "x@example.com", null);

    assertThat(unowned.isReservable()).isFalse();
    assertThatThrownBy(() -> unowned.reserve(buyer))
        .isInstanceOf(PlotStatusConflictException.class)
        .hasMessage("This plot has no seller and cannot be reserved");
    assertThat(unowned.getStatus()).isEqualTo(PlotStatus.AVAILABLE);
  }

  @Test
  void rejectsReservingAPlotThatIsNotAvailable() {
    plot.reserve(buyer);
    assertThatThrownBy(() -> plot.reserve(someoneElse))
        .isInstanceOf(PlotStatusConflictException.class)
        .hasMessage("This plot is already reserved");

    plot.sell(seller);
    assertThatThrownBy(() -> plot.reserve(someoneElse))
        .isInstanceOf(PlotStatusConflictException.class)
        .hasMessage("This plot is already sold");
  }

  @Test
  void sellsOnlyAReservedPlotAndOnlyByItsSeller() {
    assertThatThrownBy(() -> plot.sell(seller))
        .isInstanceOf(PlotStatusConflictException.class)
        .hasMessage("Only a reserved plot can be sold");

    plot.reserve(buyer);
    assertThatThrownBy(() -> plot.sell(buyer)).isInstanceOf(PlotNotOwnedException.class);
  }

  @Test
  void releasesOnlyAReservationAndOnlyForTheSellerOrTheBuyer() {
    assertThatThrownBy(() -> plot.release(buyer))
        .isInstanceOf(PlotStatusConflictException.class)
        .hasMessage("This plot is not reserved");

    plot.reserve(buyer);
    assertThatThrownBy(() -> plot.release(someoneElse))
        .isInstanceOf(ReservationNotYoursException.class);

    plot.sell(seller);
    assertThatThrownBy(() -> plot.release(seller)).isInstanceOf(PlotStatusConflictException.class);
  }

  @Test
  void freezesTheDetailsOnceReserved() {
    plot.reserve(buyer);

    assertThatThrownBy(() -> plot.changeDetails(BigDecimal.ONE, "Cheaper", "x@example.com"))
        .isInstanceOf(PlotStatusConflictException.class)
        .hasMessage("A reserved or sold plot cannot be changed");
    assertThat(plot.getPrice()).isEqualTo(BigDecimal.TEN);
  }
}
