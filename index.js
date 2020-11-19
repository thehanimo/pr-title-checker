import * as core from "@actions/core";
import * as github from "@actions/github";
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issue_number = process.env.GITHUB_REF.split("/")[2];
const configPath = core.getInput("configuration-path");
const { Octokit } = require("@octokit/action");

const octokit = new Octokit();

// most @actions toolkit packages have async methods
async function run() {
  try {
    const title = github.context.payload.pull_request.title;
    const labels = github.context.payload.pull_request.labels;

    

    let a = await getJSON(configPath);
    let { CHECKS, LABEL } = JSON.parse(a);
    LABEL.name = LABEL.name || "title needs formatting";
    LABEL.color = LABEL.color || "eee";
    CHECKS.ignoreLabels = CHECKS.ignoreLabels || []

    for (let i = 0; i < labels.length; i++) {
      for (let j = 0; j < CHECKS.ignoreLabels.length; j++) {
        if (labels[i].name == CHECKS.ignoreLabels[j]){
          core.info("Ignoring Title Check for label - " + labels[i].name);
          return
        }
      }
    }

    try {
      let createResponse = await octokit.issues.createLabel({
        owner,
        repo,
        name: LABEL.name,
        color: LABEL.color,
      });
      core.info(`Creating label (${LABEL.name}) - ` + createResponse.status);
    } catch (error) {
      core.info(`Label (${LABEL.name}) exists.`);
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
    let addLabelResponse = await octokit.issues.addLabels({
      owner,
      repo,
      issue_number,
      labels: [name],
    });
    core.info(`Adding label (${name}) - ` + addLabelResponse.status);
    if (!alwaysPassCI) core.setFailed("Failing CI test");
  } catch (error) {
    core.info("All OK");
  }
}

async function removeLabel(name) {
  try {
    let removeLabelResponse = await octokit.issues.removeLabel({
      owner,
      repo,
      issue_number,
      name: name,
    });
    core.info(
      "No mismatches found. Deleting label - " + removeLabelResponse.status
    );
  } catch (error) {
    core.info("All OK");
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

run();
