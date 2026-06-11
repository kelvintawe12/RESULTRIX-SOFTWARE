# TODO

- [ ] Fix TS errors in `src/src/App.tsx` wrappers related to `UserRole` mismatch.
- [ ] Fix TS errors in `src/src/components/forms/AddSubjectModal.tsx` (and add-teachermodal if referenced) by removing unused imports/components and correcting implicit `any` and incorrect module paths.
- [ ] Re-run `npx tsc -p tsconfig.json --noEmit` (without `&&` chaining due to shell limitations) and keep iterating until the app compiles enough to test `/unauthorized`.

