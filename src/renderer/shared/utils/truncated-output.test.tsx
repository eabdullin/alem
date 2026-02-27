import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TruncatedOutput, OUTPUT_PREVIEW_LIMIT } from "./truncated-output";

describe("TruncatedOutput", () => {
  it("renders short text without truncation", () => {
    render(<TruncatedOutput text="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("truncates long text and shows Show more button", () => {
    const longText = "a".repeat(OUTPUT_PREVIEW_LIMIT + 50);
    render(<TruncatedOutput text={longText} />);
    expect(screen.getByText(longText.slice(0, OUTPUT_PREVIEW_LIMIT))).toBeInTheDocument();
    const showBtn = screen.getByRole("button", { name: /show more/i });
    expect(showBtn).toBeInTheDocument();
  });

  it("expands to show full text when Show more is clicked", () => {
    const longText = "Full content here";
    render(<TruncatedOutput text={longText} maxLength={5} />);
    expect(screen.getByText(/^Full/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show more/i }));
    expect(screen.getByText("Full content here")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show less/i })).toBeInTheDocument();
  });

  it("collapses when Show less is clicked", () => {
    const longText = "Expand and collapse";
    render(<TruncatedOutput text={longText} maxLength={5} />);
    fireEvent.click(screen.getByRole("button", { name: /show more/i }));
    fireEvent.click(screen.getByRole("button", { name: /show less/i }));
    expect(screen.getByText(/^Expan/)).toBeInTheDocument();
  });

  it("uses custom render when provided", () => {
    render(
      <TruncatedOutput
        text="Custom"
        render={(content) => <span data-testid="custom">{content}</span>}
      />,
    );
    expect(screen.getByTestId("custom")).toHaveTextContent("Custom");
  });
});
