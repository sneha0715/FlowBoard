package com.flowboard.auth.mapper;

import com.flowboard.auth.dto.request.RegisterRequest;
import com.flowboard.auth.dto.response.UserResponse;
import com.flowboard.auth.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @Mapping(target = "passwordHash", source = "password")
    @Mapping(target = "role", defaultValue = "MEMBER")
    @Mapping(target = "isActive", defaultValue = "true")
    @Mapping(target = "avatarUrl", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    User toEntity(RegisterRequest request);

    UserResponse toResponse(User user);
}
