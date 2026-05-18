package com.creaditn.creaditnbackend.util;

import com.creaditn.creaditnbackend.service.UserService;
import lombok.experimental.UtilityClass;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Utility class for user-related operations
 */
@UtilityClass
public class UserUtil {

    /**
     * Extract user ID from UserDetails (Principal)
     * @param userDetails the authenticated user's UserDetails (email is username)
     * @param userService the UserService to lookup the user
     * @return the user's ID
     */
    public static Long extractUserId(UserDetails userDetails, UserService userService) {
        return userService.getUserByEmail(userDetails.getUsername()).getId();
    }
}
