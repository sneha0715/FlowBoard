package com.flowboard.auth.mapper;

import com.flowboard.auth.dto.request.RegisterRequest;
import com.flowboard.auth.dto.response.UserResponse;
import com.flowboard.auth.model.Role;
import com.flowboard.auth.model.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-09T00:37:34+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public User toEntity(RegisterRequest request) {
        if ( request == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

        user.passwordHash( request.getPassword() );
        if ( request.getRole() != null ) {
            user.role( request.getRole() );
        }
        else {
            user.role( Role.MEMBER );
        }
        if ( request.getIsActive() != null ) {
            user.isActive( request.getIsActive() );
        }
        else {
            user.isActive( true );
        }
        user.email( request.getEmail() );
        user.fullName( request.getFullName() );
        user.provider( request.getProvider() );
        user.userName( request.getUserName() );

        return user.build();
    }

    @Override
    public UserResponse toResponse(User user) {
        if ( user == null ) {
            return null;
        }

        UserResponse.UserResponseBuilder userResponse = UserResponse.builder();

        userResponse.avatarUrl( user.getAvatarUrl() );
        userResponse.createdAt( user.getCreatedAt() );
        userResponse.email( user.getEmail() );
        userResponse.fullName( user.getFullName() );
        userResponse.isActive( user.getIsActive() );
        userResponse.provider( user.getProvider() );
        userResponse.role( user.getRole() );
        userResponse.userId( user.getUserId() );
        userResponse.userName( user.getUserName() );

        return userResponse.build();
    }
}
