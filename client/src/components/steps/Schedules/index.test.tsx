import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";

import { useStore } from "../../../store/store";
import Schedules from "../Schedules";

beforeEach(() => render(<Schedules />, { wrapper: MemoryRouter }));

afterEach(() => cleanup());

test("renders schedule page", () => {
  const title = screen.getByRole("heading", { name: "Schedules" });
  expect(title).toBeInTheDocument();
});

test("Test that a default template is used if no active template", () => {
  const configName = "testName";
  const [template, ..._rest] = useStore.getState().getTemplates();
  act(() => {
    useStore.getState().addConfig(template, { name: configName });
  });

  expect(screen.getByText(configName)).toBeInTheDocument();
});

test("Changing active template should update widget", () => {
  const configName1 = "special-config-name-1";
  const configName2 = "special-config-name-2";
  const [template1, template2, ..._rest] = useStore.getState().getTemplates();
  act(() => {
    useStore.getState().addConfig(template1, { name: configName1 });
    useStore.getState().addConfig(template2, { name: configName2 });
    useStore.getState().setActiveTemplate(template2);
  });
  expect(screen.getByText(configName2)).toBeInTheDocument();

  act(() => {
    useStore.getState().setActiveTemplate(template1);
  });

  expect(screen.getByText(configName1)).toBeInTheDocument();
});

// combobox is the name for dropdown

test("Test that the add systems widget adds systems", async () => {
  const configName = "testName";
  const quantity = "10";
  const [template, ..._rest] = useStore.getState().getTemplates();
  act(() => {
    useStore.getState().addConfig(template, { name: configName });
  });

  userEvent.clear(screen.getByRole("spinbutton", { name: "Quantity" }));
  userEvent.type(
    await screen.findByRole("spinbutton", { name: "Quantity" }),
    quantity,
  );
  userEvent.click(screen.getByRole("button", { name: "Apply" }));

  // When testing a formik submit, make sure to use 'waitFor'
  await waitFor(() => {
    expect(useStore.getState().getUserSystems().length).toBe(Number(quantity));
  });
});
