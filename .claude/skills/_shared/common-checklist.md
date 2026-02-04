# Common Code Quality Checklist

## Before Commit

- [ ] Code compiles/builds without errors
- [ ] All tests pass
- [ ] No linting errors
- [ ] No type errors (if applicable)

## Code Quality

- [ ] No hardcoded secrets or credentials
- [ ] No console.log/print statements (unless intentional)
- [ ] Error handling is appropriate
- [ ] Edge cases are handled

## Security

- [ ] Input validation present
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Authentication/authorization checks in place

## Performance

- [ ] No N+1 queries
- [ ] No unnecessary re-renders (frontend)
- [ ] Large data sets are paginated
- [ ] Expensive operations are cached/memoized

## Documentation

- [ ] Public APIs are documented
- [ ] Complex logic has comments
- [ ] README updated if needed
