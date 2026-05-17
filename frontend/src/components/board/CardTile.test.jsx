import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CardTile from "./CardTile";

describe("CardTile", () => {
  const mockCard = {
    id: "1",
    title: "Test Card",
    priority: "HIGH",
    status: "TO_DO",
    dueDate: "2026-12-31T23:59:59",
    assigneeId: "user123",
  };

  const mockProvided = {
    innerRef: vi.fn(),
    draggableProps: {},
    dragHandleProps: {},
  };

  const mockSnapshot = {
    isDragging: false,
  };

  it("renders card title and priority", () => {
    render(
      <CardTile
        card={mockCard}
        provided={mockProvided}
        snapshot={mockSnapshot}
        onOpen={() => {}}
      />
    );

    expect(screen.getByText("Test Card")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("calls onOpen when clicked", () => {
    const onOpenMock = vi.fn();
    render(
      <CardTile
        card={mockCard}
        provided={mockProvided}
        snapshot={mockSnapshot}
        onOpen={onOpenMock}
      />
    );

    fireEvent.click(screen.getByText("Test Card"));
    expect(onOpenMock).toHaveBeenCalledTimes(1);
  });

  it("shows overdue icon if card is overdue", () => {
    const overdueCard = {
      ...mockCard,
      dueDate: "2020-01-01T00:00:00",
      status: "TO_DO",
    };

    render(
      <CardTile
        card={overdueCard}
        provided={mockProvided}
        snapshot={mockSnapshot}
        onOpen={() => {}}
      />
    );

    // Overdue cards use AlertCircle icon, and have color var(--color-error)
    // We can check if the element has the text of the date
    const dateText = screen.getByText(/Jan 1/i);
    expect(dateText).toBeInTheDocument();
    expect(dateText).toHaveStyle({ color: "var(--color-error)" });
  });
});
