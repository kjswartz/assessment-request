import { context, getOctokit } from "@actions/github";
import { run } from "./ai";
import {
  getPromptFileFromLabels,
  getAILabelAssessmentValue,
  writeActionSummary,
  getSystemPromptMsg,
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
  const token = process.env.token || process.env.GITHUB_TOKEN;
  const owner = context?.repo?.owner;
  const repo = context?.repo?.repo;

  const promptsDirectory = process.env.prompts_directory;
  const aiReviewLabel = process.env.ai_review_label;
  const labelsToPromptsMapping = process.env.labels_to_prompts_mapping;

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
  const endpoint = process.env.endpoint || "https://models.github.ai/inference";
  const modelName = process.env.model || "openai/gpt-4o";
  const maxTokens: number = parseInt(process.env.max_tokens || "200", 10);

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

  const systemPromptMsg = getSystemPromptMsg(promptFile, promptsDirectory);
  if (!systemPromptMsg) {
    throw new Error("Prompt message not found");
  }

  console.log("Executing AI assessment...");
  const aiResponse = await run({
    systemPromptMsg,
    endpoint,
    modelName,
    maxTokens,
    token,
    content: issueBody,
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
