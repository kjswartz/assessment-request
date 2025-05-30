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

To build:

```bash
bun run build
```

### Description
This action is responsible for providing an Azure AI comment on issues based on their labels. You assign a `ai_review_label` trigger label in the workflow action file, and a string mapping of labels to prompt files separated by `|`. Format: `label1,prompt1.prompt.yml|label2,prompt2.prompt.yml`. The issue's labels determine which prompt file is used for the AI configuration options (model name, max tokens and system prompt). 

```yaml
messages:
  - role: system
    content: message here will be passed as the systemPrompt variable
  - role: user
    content: '{{input}}'
model: openai/gpt-4o-mini
modelParameters:
  max_tokens: 100
testData: []
evaluators: []
```

An assessment value will be attempted to be extracted from the AI response by trying to find a line matching `/^###.*Assessment:/` (i.e. `### AI Assessment` or `### Alignment Assessment`). If no value is found, then the value `unsure` will be used. The assessment is then downcased and prefixed with `ai:` and added as a label to the issue (i.e. `ai:aligned`, `ai:neutral`, `ai:not aligned`, `ai:ready for review`, `ai:missing details`, `ai:unsure`). The assessment values largely depend on the instructions in the system prompt section. Finally this action will remove the `ai_review_label` trigger label. If you want a new review you can edit your issue body and then re-add the `ai_review_label` trigger label. 

## Inputs

Various inputs are defined in `action.yml` to let you configure
the action:

| Name                 | Description                                                                                                                                       | Default                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `token`              | Token to use for inference. Typically the GITHUB_TOKEN secret                                                                                     | `github.token`                       |
| `ai_review_label`             | The label applied to the issue to trigger AI review                                                                                                                   | N/A                                  |
| `prompts_directory`        | The path to the directory where the `.prompt.yml` files are located                             | N/A                                 |
| `labels_to_prompts_mapping`      | A mapping of labels to prompt files, separated by `\|`. Format: `label1,prompt1.prompt.yml\|label2,prompt2.prompt.yml`                                                                                                            | N/A      |
| `model`              | The model to use for inference. Must be available in the [GitHub Models](https://github.com/marketplace?type=models) catalog. Format: `{publisher}/{model_name}`                      | `openai/gpt-4o-mini`                             |
| `endpoint`           | The endpoint to use for inference. If you're running this as part of an org, you should probably use the org-specific Models endpoint             | `https://models.github.ai/inference` |
| `max-tokens`         | The max number of tokens to generate                                                                                                              | 200                                  |