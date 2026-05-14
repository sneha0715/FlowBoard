package com.flowboard.auth.mapper;

import com.flowboard.auth.dto.request.RegisterRequest;
import com.flowboard.auth.dto.response.UserResponse;
import com.flowboard.auth.model.Role;
import com.flowboard.auth.model.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-14T23:15:32+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 20.0.1 (Oracle Corporation)"
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
        user.fullName( request.getFullName() );
        user.email( request.getEmail() );
        user.userName( request.getUserName() );
        user.provider( request.getProvider() );

        return user.build();
    }

    @Override
    public UserResponse toResponse(User user) {
        if ( user == null ) {
            return null;
        }

        UserResponse.UserResponseBuilder userResponse = UserResponse.builder();

        userResponse.userId( user.getUserId() );
        userResponse.fullName( user.getFullName() );
        userResponse.email( user.getEmail() );
        userResponse.userName( user.getUserName() );
        userResponse.role( user.getRole() );
        userResponse.avatarUrl( user.getAvatarUrl() );
        userResponse.provider( user.getProvider() );
        userResponse.isActive( user.getIsActive() );
        userResponse.createdAt( user.getCreatedAt() );

        return userResponse.build();
    }
}
