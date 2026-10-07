package io.github.ctrindadedev.lotline.identity.service;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/** The logged-in user kept in the session. No roles: every account can do the same things. */
public final class UserAccount implements UserDetails, CredentialsContainer {

  private final UUID id;
  private final String name;
  private final String email;
  private String passwordHash;

  UserAccount(UUID id, String name, String email, String passwordHash) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.passwordHash = passwordHash;
  }

  public UUID id() {
    return id;
  }

  public String name() {
    return name;
  }

  public String email() {
    return email;
  }

  @Override
  public String getUsername() {
    return email;
  }

  @Override
  public String getPassword() {
    return passwordHash;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return List.of();
  }

  @Override
  public void eraseCredentials() {
    passwordHash = null;
  }
}
