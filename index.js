import * as core from "@actions/core";
import * as github from "@actions/github";
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issue_number = process.env.GITHUB_REF.split("/")[2];
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
    } catch (e) {
      core.setFailed(`Couldn't retrieve the config file specified - ${e}`);
      return;
    }
    let { CHECKS, LABEL } = JSON.parse(config);
    LABEL.name = LABEL.name || "title needs formatting";
    LABEL.color = LABEL.color || "eee";
    CHECKS.ignoreLabels = CHECKS.ignoreLabels || [];

    for (let i = 0; i < labels.length; i++) {
      for (let j = 0; j < CHECKS.ignoreLabels.length; j++) {
        if (labels[i].name == CHECKS.ignoreLabels[j]) {
          core.info(`Ignoring Title Check for label - ${labels[i].name}`);
          return;
        }
      }
    }

    try {
      core.info(`Creating label (${LABEL.name})...`);
      let createResponse = await octokit.issues.createLabel({
        owner,
        repo,
        name: LABEL.name,
        color: LABEL.color,
      });
      core.info(`Created label (${LABEL.name}) - ${createResponse.status}`);
    } catch (error) {
      // Might not always be due to label's existence
      core.info(`Label (${LABEL.name}) already created.`);
    }
    if (CHECKS.prefixes && CHECKS.prefixes.length) {
      for (let i = 0; i < CHECKS.prefixes.length; i++) {
        if (title.startsWith(CHECKS.prefixes[i])) {
          removeLabel(LABEL.name);
          return;
        }
      }
    }

    if (CHECKS.regexp) {
      let re = new RegExp(CHECKS.regexp);
      if (re.test(title)) {
        removeLabel(LABEL.name);
        return;
      }
    }

    addLabel(LABEL.name, CHECKS.alwaysPassCI);
  } catch (error) {
    core.info(error);
  }
}

async function addLabel(name, alwaysPassCI) {
  try {
    core.info(`Adding label (${name}) to PR...`);
    let addLabelResponse = await octokit.issues.addLabels({
      owner,
      repo,
      issue_number,
      labels: [name],
    });
    core.info(`Added label (${name}) to PR - ${addLabelResponse.status}`);
    if (!alwaysPassCI) {
      core.setFailed("Failing CI test");
    }
    core.info("All OK");
  } catch (error) {
    core.info(error);
    if (alwaysPassCI) {
      core.info(`Failed to add label (${name}) to PR`);
    } else {
      core.setFailed(`Failed to add label (${name}) to PR`);
    }
  }
}

async function removeLabel(name) {
  try {
    core.info("No formatting necessary. Removing label...");
    let removeLabelResponse = await octokit.issues.removeLabel({
      owner,
      repo,
      issue_number,
      name: name,
    });
    core.info(`Removed label - ${removeLabelResponse.status}`);
  } catch (error) {
    core.info(error);
    if (alwaysPassCI) {
      core.info(`Failed to remove label (${name}) from PR`);
    } else {
      core.setFailed(`Failed to remove label (${name}) from PR`);
    }
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
