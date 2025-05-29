# request-assessment

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

To run tests:

```bash
bun test
```

### Description
This action is responsible for providing an Azure AI comment on `intake` or `bug` template issues. The issue's labels determine which system prompt file is used for either determining issue alignment with team charter, or completeness in bug reporting. Issues with the label `request ai review` added to it will trigger this action, which are new `intake` or `bug` templated issues. Issues generated via the intake template have the label `support request` added, and bug template issues have a `bug` label added. These `support request` and `bug` labels are used to determine which system prompt file to utilize: `assess_bug.md` or `assess_request.md`. This action will add the AI generated comment to the issue, add a label for the overall alignment assessment (`ai:aligned`, `ai:neutral`, `ai:not-aligned`), or bug report assessment (`ai:ready for review`, `ai:missing details`, `ai:unsure`), and finally it'll remove the `request ai review` label. If you want a new review you can edit your issue body and then re-add the `request ai review` label. 

### Ways To Trigger Action
- Opening a new `intake` or `bug` templated issue.
- Adding `request ai review` label to an issue along with `bug` or `support request` label. **NOTE**: Having both `bug` and `support request` labels will cause the action to use the `assess_request.md` file for the system prompt, checking for issue alignment against the team charter.
- You can re-add the `request ai review` to re-trigger the action as many times as you want. If you get an `ai:not-aligned`, `ai:unsure`, or `ai:missing details` label assessment, then you can edit the issue body, remove the AI rating label and re-add the `request ai review` label. This will cause the action to use the new issue body to generate a new AI assessment rating label. 
