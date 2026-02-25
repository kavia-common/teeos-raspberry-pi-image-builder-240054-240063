import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("renders wizard shell with steps navigation and content", async () => {
  const user = userEvent.setup();
  render(<App />);

  // Header / brand
  expect(screen.getByText(/TEEOS RPi4 Image Builder/i)).toBeInTheDocument();

  // Sidebar
  expect(screen.getByText(/Steps/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Overview/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Set up environment/i })).toBeInTheDocument();

  // Default active content
  expect(screen.getByRole("heading", { name: /Overview/i })).toBeInTheDocument();
  expect(screen.getByText(/This wizard guides you through/i)).toBeInTheDocument();

  // Navigate to another step
  await user.click(screen.getByRole("button", { name: /Set up environment/i }));
  expect(screen.getByRole("heading", { name: /Set up environment/i })).toBeInTheDocument();
  expect(screen.getByText(/Install base tools/i)).toBeInTheDocument();
});
