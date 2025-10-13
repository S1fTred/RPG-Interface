package org.sft.tabletoprpg.security;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;

@Getter
@RequiredArgsConstructor
public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String username;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }

    public static UserPrincipal from(org.sft.tabletoprpg.domain.User u) {
        var authorities = u.getRoles().stream()
            .map(r -> new SimpleGrantedAuthority("РОЛЬ_" + r.name()))
            .toList();
        return new UserPrincipal(u.getId(), u.getUsername(), u.getPasswordHash(), authorities);
    }
}
