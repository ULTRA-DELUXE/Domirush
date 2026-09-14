import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DominoFace } from "@/components/domino/DominoFace";
import { Grid } from "@/components/grid/Grid";
import { StreakProgress } from "@/components/hud/StreakProgress";
import { generatePuzzle } from "@/lib/domino/generator";
import { getDifficultyForPosition } from "@/lib/domino/difficulty";

const { puzzle } = generatePuzzle({ ...getDifficultyForPosition(1), seed: 2026 });

describe("board rendering", () => {
  it("renders all 64 cells plus both endpoint markers", () => {
    render(<Grid puzzle={puzzle} cursor={{ row: 0, col: 0 }} onCellSelect={vi.fn()} />);

    expect(screen.getAllByRole("button")).toHaveLength(64);
    expect(screen.getByText("START")).toBeInTheDocument();
    expect(screen.getByText("END")).toBeInTheDocument();
  });

  it("shows the Start and Target pip values", () => {
    const { container } = render(
      <Grid puzzle={puzzle} cursor={{ row: 0, col: 0 }} onCellSelect={vi.fn()} />,
    );
    expect(container.textContent).toContain(String(puzzle.start.value));
    expect(container.textContent).toContain(String(puzzle.target.value));
  });

  it("keeps the board on the navy field with cream rules", () => {
    const { container } = render(
      <Grid puzzle={puzzle} cursor={{ row: 0, col: 0 }} onCellSelect={vi.fn()} />,
    );
    const board = container.firstElementChild!;
    expect(board.className).toContain("bg-navy");
    expect(board.className).toContain("border-cream");
  });
});

describe("domino face", () => {
  it("fills cream and outlines navy, never the reverse", () => {
    const { container } = render(<DominoFace tile={{ id: "2-5", a: 2, b: 5 }} />);
    const face = container.firstElementChild!;
    expect(face.className).toContain("bg-cream");
    expect(face.className).toContain("border-navy");
    expect(face.className).not.toContain("bg-navy");
  });

  it("draws one square mark per pip across both halves", () => {
    const { container } = render(<DominoFace tile={{ id: "2-5", a: 2, b: 5 }} />);
    expect(container.querySelectorAll(".pip")).toHaveLength(7);
  });

  it("renders a blank half for a zero pip", () => {
    const { container } = render(<DominoFace tile={{ id: "0-3", a: 0, b: 3 }} />);
    expect(container.querySelectorAll(".pip")).toHaveLength(3);
  });

  it("renders the full nine-pip pattern for the double-nine set", () => {
    const { container } = render(<DominoFace tile={{ id: "9-9", a: 9, b: 9 }} />);
    expect(container.querySelectorAll(".pip")).toHaveLength(18);
  });
});

describe("streak progress", () => {
  it("marks completed, current, and upcoming puzzles distinctly", () => {
    const { container } = render(<StreakProgress position={3} total={5} />);
    expect(screen.getByText("3 / 5")).toBeInTheDocument();
    expect(container.querySelectorAll(".bg-cream")).toHaveLength(2);
    expect(container.querySelectorAll(".bg-gold")).toHaveLength(1);
    expect(container.querySelectorAll(".bg-transparent")).toHaveLength(2);
  });
});

describe("sharp-edge rule", () => {
  it("uses no rounded-corner utilities anywhere in board or tile markup", () => {
    const { container } = render(
      <Grid puzzle={puzzle} cursor={{ row: 2, col: 2 }} onCellSelect={vi.fn()}>
        <DominoFace tile={{ id: "4-4", a: 4, b: 4 }} />
      </Grid>,
    );
    expect(container.innerHTML).not.toMatch(/\brounded/);
  });
});
