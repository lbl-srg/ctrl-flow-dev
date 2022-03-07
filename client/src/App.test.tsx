import {
  cleanup,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import App from "./App";

beforeEach(() => render(<App />, { wrapper: MemoryRouter }));

afterEach(() => cleanup());

test("renders welcome page", () => {
  const title = screen.getByText("Welcome to Lawrence Berkley National Labs");
  expect(title).toBeInTheDocument();
});

test("create new project modal opens and creates a new project", async () => {
  userEvent.click(screen.getByRole("button", { name: /create new project/i }));

  // Open the create project modal
  const modal = screen.getByRole("dialog");

  expect(modal).toBeInTheDocument();

  // Fill out the form
  const projectName = "My new project";
  userEvent.clear(screen.getByLabelText("Project Name:"));
  userEvent.type(screen.getByLabelText("Project Name:"), projectName);

  const address = "123 project st, Testington, CO";
  userEvent.clear(screen.getByLabelText("Address:"));
  userEvent.type(screen.getByLabelText("Address:"), address);

  const type = "warehouse";
  userEvent.selectOptions(await screen.findByTestId("type-input"), type);

  const size = "9001";
  userEvent.clear(screen.getByLabelText("Size"));
  userEvent.type(await screen.getByLabelText("Size"), size);

  const units = "ip";
  userEvent.selectOptions(await screen.findByTestId("units-input"), units);

  const code = "ashrae 90.1 20201";
  userEvent.selectOptions(await screen.findByTestId("code-input"), code);

  const notes = "These are some notes about the project I am working on!";
  userEvent.clear(screen.getByLabelText("Notes:"));
  userEvent.type(screen.getByLabelText("Notes:"), notes);

  // Save the form
  userEvent.click(screen.getByText(/create project/i));

  await waitForElementToBeRemoved(modal);

  expect(screen.getByText("Project Details")).toBeInTheDocument();

  const displayedProjNames = screen.getAllByText(projectName);
  expect(displayedProjNames).toHaveLength(2);
  displayedProjNames.map((element) => {
    expect(element).toBeInTheDocument();
  });

  expect(screen.getByText(address)).toBeInTheDocument();
  expect(screen.getByText(type)).toBeInTheDocument();
  expect(screen.getByText(size)).toBeInTheDocument();
  expect(screen.getByText(units)).toBeInTheDocument();
  expect(screen.getByText(code)).toBeInTheDocument();
  const [notes1, notes2] = screen.getAllByText(notes);
  // TODO: notes is showing up twice - not sure why
  expect(notes1).toBeInTheDocument();
});

test("navigate through steps", async () => {
  userEvent.click(screen.getByRole("button", { name: /create new project/i }));

  // Open the create project modal and move on without changes
  const modal = screen.getByRole("dialog");

  expect(modal).toBeInTheDocument();

  userEvent.click(screen.getByText(/create project/i));

  await waitForElementToBeRemoved(modal);

  expect(
    screen.getByText("Project Details", { selector: "h1" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
  expect(screen.getByText("Next Step: Systems")).toBeInTheDocument();

  userEvent.click(screen.getByText("Next Step: Systems"));
  expect(screen.getByText("Systems", { selector: "h1" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
  expect(screen.getByText("Next Step: Configs")).toBeInTheDocument();

  userEvent.click(screen.getByText("Next Step: Configs"));
  expect(
    screen.getByText("Configurations", { selector: "h1" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
  expect(screen.getByText("Next Step: Quantities")).toBeInTheDocument();

  userEvent.click(screen.getByText("Next Step: Quantities"));
  expect(
    screen.getByText("Quantities", { selector: "h1" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
  expect(screen.getByText("Next Step: Schedules")).toBeInTheDocument();

  userEvent.click(screen.getByText("Next Step: Schedules"));
  expect(screen.getByText("Schedules", { selector: "h1" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
  expect(screen.getByText("Next Step: Results")).toBeInTheDocument();

  userEvent.click(screen.getByText("Next Step: Results"));
  expect(screen.getByText("Results", { selector: "h1" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back" })).toBeInTheDocument();
});
