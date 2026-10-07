package io.github.ctrindadedev.lotline.plot.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
    this.price = price;
    this.description = description;
    this.contact = contact;
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

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }
}
