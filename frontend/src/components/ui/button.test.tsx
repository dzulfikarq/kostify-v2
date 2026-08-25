import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { describe, it, expect } from "vitest";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Daftar</Button>);
    expect(screen.getByRole("button", { name: "Daftar" })).toBeInTheDocument();
  });

  it("disables when disabled", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
