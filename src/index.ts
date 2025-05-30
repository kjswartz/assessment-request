import { context, getOctokit } from "@actions/github";
import { getInput } from "@actions/core";
import { run } from "./ai";
import {
  getPromptFileFromLabels,
  getAILabelAssessmentValue,
  writeActionSummary,
  getPromptOptions,
} from "./utils";
import { createIssueComment, addIssueLabels, removeIssueLabel } from "./api";
import type { Label } from "./types";

const main = async () => {
  const issueNumber = context?.payload?.issue?.number;
  const issueBody = context?.payload?.issue?.body;

  if (!issueNumber || !issueBody) {
    throw new Error(
      "This action can only be used in the context of an issue with a body.",
    );
  }

  // Required inputs
  const token = getInput("token");
  const owner = context?.repo?.owner;
  const repo = context?.repo?.repo;

  const promptsDirectory = getInput("prompts_directory");
  console.log(`Using prompts directory: ${promptsDirectory}`);
  const aiReviewLabel = getInput("ai_review_label");
  console.log(`Using AI review label: ${aiReviewLabel}`);
  const labelsToPromptsMapping =
    process.env.labels_to_prompts_mapping ||
    getInput("labels_to_prompts_mapping");
  console.log(`Using labels to prompts mapping: ${labelsToPromptsMapping}`);

  if (
    !token ||
    !owner ||
    !repo ||
    !promptsDirectory ||
    !aiReviewLabel ||
    !labelsToPromptsMapping
  ) {
    throw new Error("Required inputs are not set");
  }

  const octokit = getOctokit(token);

  // AI configuration
  const endpoint = process.env.endpoint || getInput("endpoint");
  console.log(`Using AI endpoint: ${endpoint}`);
  const modelName = process.env.model || getInput("model");
  console.log(`Using AI model: ${modelName}`);
  const maxTokens = getInput("max_tokens")
    ? parseInt(getInput("max_tokens"), 10)
    : undefined;
  console.log(`Using max tokens: ${maxTokens}`);
  const issueLabels: Label[] = context?.payload?.issue?.labels ?? [];

  // Get Prompt file based on issue labels and mapping
  const promptFile = getPromptFileFromLabels({
    issueLabels,
    aiReviewLabel,
    labelsToPromptsMapping,
  });

  if (!promptFile) {
    console.log("No prompt file found.");
    return;
  }

  const promptOptions = getPromptOptions(promptFile, promptsDirectory);
  console.log("ep: " + promptOptions.endpoint);
  console.log("model: " + promptOptions.model);
  console.log("tokensL " + promptOptions.maxTokens);
  console.log("Executing AI assessment...");
  const aiResponse = await run({
    token,
    content: issueBody,
    systemPromptMsg: promptOptions.systemMsg,
    endpoint: endpoint ?? promptOptions.endpoint,
    maxTokens: maxTokens ?? promptOptions.maxTokens,
    modelName: modelName ?? promptOptions.model,
  });
  if (aiResponse) {
    const commentCreated = await createIssueComment({
      octokit,
      owner,
      repo,
      issueNumber,
      body: aiResponse,
    });
    if (!commentCreated) {
      throw new Error("Failed to create comment");
    }

    // Add the assessment label to the issue
    const assessmentLabel = getAILabelAssessmentValue(aiResponse);
    await addIssueLabels({
      octokit,
      owner,
      repo,
      issueNumber,
      labels: [assessmentLabel],
    });

    // Remove the aiReviewLabel trigger label
    await removeIssueLabel({
      octokit,
      owner,
      repo,
      issueNumber,
      label: aiReviewLabel,
    });

    writeActionSummary({
      promptFile,
      aiResponse,
      assessmentLabel,
    });
  } else {
    console.log("No response received from AI.");
  }
};

if (process.env.NODE_ENV !== "test") {
  main();
}
