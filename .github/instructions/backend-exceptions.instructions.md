---
description: "Use when changing backend exceptions, validation, or HTTP error messages."
applyTo: "backend/src/**/*.java,backend/src/**/messages*.properties"
---

# Exception Handling

- Use one custom `BaseApiException`; subtypes only for distinct catch/recovery behavior, not HTTP statuses or message templates.
- Reuse `RESOURCE_NOT_FOUND`, `NAME_ALREADY_EXISTS`, and `RESOURCE_HAS_DEPENDENCIES`. Add codes only for distinct user messages/actions or handling, not per entity, validation branch, or throw site. Keep specifics in diagnostic messages and typed context, not another diagnostic enum.
- Domain exceptions carry no `HttpStatus`, `userMessage`, or public formatting. `GlobalExceptionHandler` selects `messages.properties` templates using the original domain code and context, not `ErrorCodeResponse`; shared `BAD_REQUEST` codes can have different messages. Never return `getMessage()` to users.
- Keep guards for invalid arguments already rejected by DTO validation, but use `IllegalArgumentException` with diagnostics, without business codes or translations. DTO errors remain `400`; escaped internal failures receive generic `500`.
- Test domain codes/context instead of full diagnostic wording; HTTP tests assert status and exact formatted `errorCode`/`errorMessage`. No conditional test logic; use explicit scenarios.