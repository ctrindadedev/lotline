package io.github.ctrindadedev.lotline.plot.persistence;

import io.github.ctrindadedev.lotline.plot.PlotStatus;
import io.github.ctrindadedev.lotline.plot.exception.OwnPlotReservationException;
import io.github.ctrindadedev.lotline.plot.exception.PlotNotOwnedException;
import io.github.ctrindadedev.lotline.plot.exception.PlotStatusConflictException;
import io.github.ctrindadedev.lotline.plot.exception.ReservationNotYoursException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;
import org.locationtech.jts.geom.Polygon;

/** A land plot listed for sale. The schema is owned by Liquibase; this mapping is validated. */
@Entity
@Table(name = "plots")
public class Plot {

  @Id
  @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
  private UUID id;

  @Column(nullable = false)
  private Polygon boundary;

  @Column(nullable = false, precision = 14, scale = 2)
  private BigDecimal price;

  @Column(nullable = false, length = 2000)
  private String description;

  @Column(nullable = false)
  private String contact;

  @Column(name = "owner_id")
  private UUID ownerId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private PlotStatus status = PlotStatus.AVAILABLE;

  @Column(name = "buyer_id")
  private UUID buyerId;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(nullable = false)
  private Instant updatedAt;

  protected Plot() {}

  public Plot(
      Polygon boundary, BigDecimal price, String description, String contact, UUID ownerId) {
    this.boundary = boundary;
    this.price = price;
    this.description = description;
    this.contact = contact;
    this.ownerId = ownerId;
  }

  public void changeDetails(BigDecimal price, String description, String contact) {
    ensureChangeable();
    this.price = price;
    this.description = description;
    this.contact = contact;
  }

  public void ensureChangeable() {
    if (status != PlotStatus.AVAILABLE) {
      throw new PlotStatusConflictException("A reserved or sold plot cannot be changed");
    }
  }

  public void reserve(UUID userId) {
    if (isOwnedBy(userId)) {
      throw new OwnPlotReservationException();
    }
    if (!isReservable()) {
      throw new PlotStatusConflictException("This plot has no seller and cannot be reserved");
    }
    if (status != PlotStatus.AVAILABLE) {
      throw new PlotStatusConflictException(
          status == PlotStatus.RESERVED
              ? "This plot is already reserved"
              : "This plot is already sold");
    }
    status = PlotStatus.RESERVED;
    buyerId = userId;
  }

  public void release(UUID userId) {
    if (status != PlotStatus.RESERVED) {
      throw new PlotStatusConflictException("This plot is not reserved");
    }
    if (!isOwnedBy(userId) && !userId.equals(buyerId)) {
      throw new ReservationNotYoursException();
    }
    status = PlotStatus.AVAILABLE;
    buyerId = null;
  }

  public void sell(UUID userId) {
    if (!isOwnedBy(userId)) {
      throw new PlotNotOwnedException();
    }
    if (status != PlotStatus.RESERVED) {
      throw new PlotStatusConflictException("Only a reserved plot can be sold");
    }
    status = PlotStatus.SOLD;
  }

  /** Unowned plots (listed before accounts) have no seller to release or sell them. */
  public boolean isReservable() {
    return ownerId != null;
  }

  public boolean isOwnedBy(UUID userId) {
    return ownerId != null && ownerId.equals(userId);
  }

  public UUID getId() {
    return id;
  }

  public Polygon getBoundary() {
    return boundary;
  }

  public BigDecimal getPrice() {
    return price;
  }

  public String getDescription() {
    return description;
  }

  public String getContact() {
    return contact;
  }

  public UUID getOwnerId() {
    return ownerId;
  }

  public PlotStatus getStatus() {
    return status;
  }

  public UUID getBuyerId() {
    return buyerId;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
