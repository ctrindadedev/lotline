package io.github.ctrindadedev.lotline.identity.service;

import io.github.ctrindadedev.lotline.identity.exception.EmailAlreadyRegisteredException;
import io.github.ctrindadedev.lotline.identity.persistence.User;
import io.github.ctrindadedev.lotline.identity.persistence.UserRepository;
import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService implements UserDetailsService {

  private static final String EMAIL_UNIQUE = "users_email_unique";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public AccountService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  public static String normalizeEmail(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }

  @Transactional
  public UserAccount register(NewUser newUser) {
    String email = normalizeEmail(newUser.email());
    if (userRepository.existsByEmail(email)) {
      throw new EmailAlreadyRegisteredException();
    }
    try {
      User user =
          userRepository.saveAndFlush(
              new User(newUser.name().trim(), email, passwordEncoder.encode(newUser.password())));
      return toAccount(user);
    } catch (DataIntegrityViolationException e) {
      if (String.valueOf(e.getMostSpecificCause().getMessage()).contains(EMAIL_UNIQUE)) {
        throw new EmailAlreadyRegisteredException();
      }
      throw e;
    }
  }

  @Override
  @Transactional(readOnly = true)
  public UserAccount loadUserByUsername(String email) {
    return userRepository
        .findByEmail(normalizeEmail(email))
        .map(AccountService::toAccount)
        .orElseThrow(() -> new UsernameNotFoundException("No account for this email"));
  }

  private static UserAccount toAccount(User user) {
    return new UserAccount(user.getId(), user.getName(), user.getEmail(), user.getPasswordHash());
  }
}
