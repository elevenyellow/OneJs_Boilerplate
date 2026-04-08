#!/bin/bash
CMD=$(jq -r '.tool_input.command // ""' 2>/dev/null)

if echo "$CMD" | grep -qE '^git commit'; then
  echo '{"continue":false,"stopReason":"§15 DDD COMPLIANCE CHECK — Before committing, verify ALL items: (1) Use case params are VOs not primitives (2) Repo method params are VOs (CityId, Limit) not string/number (3) Services are @Injectable() with instance methods, not static (4) DTOs are classes with constructors, not type aliases (5) New VOs have validation tests (6) New use cases have unit tests (7) Controllers only: parse input → build VOs → call use case → return (8) No fetch/HTTP in use cases or controllers. Confirm each item, fix any violations, then retry."}'
fi
