export interface AutocompleteSuggestion {
  readonly id: number | string;
  readonly value: string;
}

export interface AutocompletePolicy {
  readonly minimumQueryLength: number;

  queryAfterSuggestionFocus(
    currentQuery: string,
    suggestion: AutocompleteSuggestion
  ): string;

  queryAfterSuggestionSelection(suggestion: AutocompleteSuggestion): string;
}

export class ListSearchPolicy implements AutocompletePolicy {
  public readonly minimumQueryLength = 0;

  public queryAfterSuggestionFocus(
    _currentQuery: string,
    suggestion: AutocompleteSuggestion
  ): string {
    return suggestion.value;
  }

  public queryAfterSuggestionSelection(
    _suggestion: AutocompleteSuggestion
  ): string {
    return "";
  }
}

export class FormSearchPolicy implements AutocompletePolicy {
  public constructor(public readonly minimumQueryLength = 3) {}

  public queryAfterSuggestionFocus(
    currentQuery: string,
    _suggestion: AutocompleteSuggestion
  ): string {
    return currentQuery;
  }

  public queryAfterSuggestionSelection(
    suggestion: AutocompleteSuggestion
  ): string {
    return suggestion.value;
  }
}

export interface AutocompleteSnapshot<
  TSuggestion extends AutocompleteSuggestion
> {
  readonly query: string;
  readonly suggestions: readonly TSuggestion[];
  readonly hasSelectedSuggestion: boolean;
}

export interface SuggestionRequest {
  readonly id: number;
  readonly query: string;
}

export class AutocompleteController<
  TSuggestion extends AutocompleteSuggestion
> {
  private query = "";
  private suggestions: readonly TSuggestion[] = [];
  private hasSelectedSuggestion = false;
  private requestId = 0;

  public constructor(private readonly policy: AutocompletePolicy) {}

  public get snapshot(): AutocompleteSnapshot<TSuggestion> {
    return {
      query: this.query,
      suggestions: this.suggestions,
      hasSelectedSuggestion: this.hasSelectedSuggestion
    };
  }

  public type(query: string): AutocompleteSnapshot<TSuggestion> {
    this.invalidateSuggestionRequests();
    this.query = query;
    this.hasSelectedSuggestion = false;

    if (!this.canRequestSuggestions()) {
      this.suggestions = [];
    }

    return this.snapshot;
  }

  public focusSuggestion(
    suggestion: TSuggestion
  ): AutocompleteSnapshot<TSuggestion> {
    this.query = this.policy.queryAfterSuggestionFocus(this.query, suggestion);
    return this.snapshot;
  }

  public selectSuggestion(
    suggestion: TSuggestion
  ): AutocompleteSnapshot<TSuggestion> {
    this.invalidateSuggestionRequests();
    this.query = this.policy.queryAfterSuggestionSelection(suggestion);
    this.suggestions = [];
    this.hasSelectedSuggestion = true;
    return this.snapshot;
  }

  public showSuggestions(
    suggestions: readonly TSuggestion[]
  ): AutocompleteSnapshot<TSuggestion> {
    if (!this.hasSelectedSuggestion) {
      this.suggestions = [...suggestions];
    }
    return this.snapshot;
  }

  public requestSuggestions(): SuggestionRequest | undefined {
    if (!this.canRequestSuggestions()) {
      return undefined;
    }

    return { id: ++this.requestId, query: this.query };
  }

  public resolveSuggestions(
    request: SuggestionRequest,
    suggestions: readonly TSuggestion[]
  ): AutocompleteSnapshot<TSuggestion> | undefined {
    if (
      request.id !== this.requestId ||
      request.query !== this.query ||
      this.hasSelectedSuggestion
    ) {
      return undefined;
    }

    this.suggestions = [...suggestions];
    return this.snapshot;
  }

  private canRequestSuggestions(): boolean {
    return (
      !this.hasSelectedSuggestion &&
      this.query.trim().length >= this.policy.minimumQueryLength &&
      this.query.length > 0
    );
  }

  private invalidateSuggestionRequests(): void {
    this.requestId += 1;
  }
}
