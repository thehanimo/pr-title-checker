import * as core from "@actions/core";
import * as github from "@actions/github";
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issue_number = github.context.issue.number;
const configPath = process.env.INPUT_CONFIGURATION_PATH;
const passOnOctokitError = process.env.INPUT_PASS_ON_OCTOKIT_ERROR === "true";
const { Octokit } = require("@octokit/action");

let octokit;

// most @actions toolkit packages have async methods
async function run() {
  try {
    const title = github.context.payload.pull_request.title;
    const labels = github.context.payload.pull_request.labels;

    let config;
    try {
      config = await getJSON(configPath);
      config = JSON.parse(config);
    } catch (e) {
      core.setFailed(`Couldn't retrieve or parse the config file specified - ${e}`);
      return;
    }
    let { CHECKS, LABEL, MESSAGES } = config;
    LABEL = LABEL || {};
    LABEL.name = LABEL.name || "";
    LABEL.color = LABEL.color || "eee";
    CHECKS.ignoreLabels = CHECKS.ignoreLabels || [];
    MESSAGES = MESSAGES || {};
    MESSAGES.success = MESSAGES.success || "All OK";
    MESSAGES.failure = MESSAGES.failure || "Failing CI test";
    MESSAGES.notice = MESSAGES.notice || "";

    for (let i = 0; i < labels.length; i++) {
      for (let j = 0; j < CHECKS.ignoreLabels.length; j++) {
        if (labels[i].name == CHECKS.ignoreLabels[j]) {
          core.info(`Ignoring Title Check for label - ${labels[i].name}`);
          removeLabel(labels, LABEL.name);
          return;
        }
      }
    }

    await createLabel(LABEL.name, LABEL.color);

    if (CHECKS.prefixes && CHECKS.prefixes.length) {
      for (let i = 0; i < CHECKS.prefixes.length; i++) {
        if (title.startsWith(CHECKS.prefixes[i])) {
          removeLabel(labels, LABEL.name);
          core.info(MESSAGES.success);
          return;
        }
      }
    }

    if (CHECKS.regexp) {
      let re = new RegExp(CHECKS.regexp, CHECKS.regexpFlags || "");
      if (re.test(title)) {
        removeLabel(labels, LABEL.name);
        core.info(MESSAGES.success);
        return;
      }
    }

    await titleCheckFailed(CHECKS, LABEL, MESSAGES);
  } catch (error) {
    core.info(error);
  }
}

async function titleCheckFailed(CHECKS, LABEL, MESSAGES) {
  try {
    if (MESSAGES.notice.length) {
      core.notice(MESSAGES.notice);
    }

    await addLabel(LABEL.name);

    if (CHECKS.alwaysPassCI) {
      core.info(MESSAGES.failure);
    } else {
      core.setFailed(MESSAGES.failure);
    }
  } catch (error) {
    core.info(error);
    if (CHECKS.alwaysPassCI) {
      core.info(`Failed to add label (${LABEL.name}) to PR`);
    } else {
      core.setFailed(`Failed to add label (${LABEL.name}) to PR`);
    }
  }
}

async function createLabel(name, color) {
  if (name === '') {
    return;
  }

  try {
    core.info(`Creating label (${name})...`);
    let createResponse = await octokit.issues.createLabel({
      owner,
      repo,
      name: name,
      color: color,
    });
    core.info(`Created label (${name}) - ${createResponse.status}`);
  } catch (error) {
    // Might not always be due to label's existence
    core.info(`Label (${name}) already created.`);
  }
}

async function addLabel(name) {
  if (name === '') {
    return;
  }

  core.info(`Adding label (${name}) to PR...`);
  let addLabelResponse = await octokit.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [name],
  });
  core.info(`Added label (${name}) to PR - ${addLabelResponse.status}`);
}

async function removeLabel(labels, name) {
  if (name === '') {
    return;
  }

  try {
    if (
      !labels
        .map((label) => label.name.toLowerCase())
        .includes(name.toLowerCase())
    ) {
      return;
    }

    core.info("No formatting necessary. Removing label...");
    let removeLabelResponse = await octokit.issues.removeLabel({
      owner,
      repo,
      issue_number,
      name: name,
    });
    core.info(`Removed label - ${removeLabelResponse.status}`);
  } catch (error) {
    core.info(`Failed to remove label (${name}) from PR: ${error}`);
  }
}

async function getJSON(repoPath) {
  const response = await octokit.repos.getContent({
    owner,
    repo,
    path: repoPath,
    ref: github.context.sha,
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
}

async function handleOctokitError(e) {
  core.info(`Octokit Error - ${e}`);
  if (passOnOctokitError) {
    core.info("Passing CI regardless");
  } else {
    core.setFailed("Failing CI test");
  }
}

try {
  octokit = new Octokit();
} catch (e) {
  handleOctokitError(e);
}

if (octokit) {
  run();
}
