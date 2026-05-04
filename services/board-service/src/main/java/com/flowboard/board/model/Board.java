package com.flowboard.board.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "boards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Board {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long boardId;

    @Column(nullable = false)
    private Long workspaceId;

    @Column(nullable = false)
    private String name;

    private String description;

    private String background;

    @Column(nullable = false)
    private String visibility; // e.g., PRIVATE, WORKSPACE, PUBLIC

    @Column(nullable = false)
    private Long createdById;

    @Column(nullable = false)
    @Builder.Default
    private boolean closed = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
