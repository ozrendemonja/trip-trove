import {
  AutocompleteController,
  FormSearchPolicy,
  ListSearchPolicy
} from "../AutocompleteController";

const suggestion = { id: 1, value: "Monaco" };

describe("AutocompleteController", () => {
  test("previews and clears a list-search suggestion", () => {
    const controller = new AutocompleteController(new ListSearchPolicy());

    controller.type("Mon");
    controller.showSuggestions([suggestion]);

    expect(controller.focusSuggestion(suggestion).query).toBe("Monaco");
    expect(controller.selectSuggestion(suggestion)).toEqual({
      query: "",
      suggestions: [],
      hasSelectedSuggestion: true
    });
  });

  test("retains a selected form-search suggestion", () => {
    const controller = new AutocompleteController(new FormSearchPolicy());

    expect(controller.type("Mo").suggestions).toEqual([]);
    expect(controller.requestSuggestions()).toBeUndefined();

    controller.type("Mon");
    controller.showSuggestions([suggestion]);

    expect(controller.focusSuggestion(suggestion).query).toBe("Mon");
    expect(controller.selectSuggestion(suggestion)).toEqual({
      query: "Monaco",
      suggestions: [],
      hasSelectedSuggestion: true
    });
  });

  test("ignores suggestions from an outdated request", () => {
    const controller = new AutocompleteController(new FormSearchPolicy());

    controller.type("Mon");
    const outdatedRequest = controller.requestSuggestions();
    controller.type("Mona");
    const currentRequest = controller.requestSuggestions();

    expect(
      controller.resolveSuggestions(outdatedRequest!, [suggestion])
    ).toBeUndefined();
    expect(
      controller.resolveSuggestions(currentRequest!, [suggestion])
    ).toEqual({
      query: "Mona",
      suggestions: [suggestion],
      hasSelectedSuggestion: false
    });
  });
});
