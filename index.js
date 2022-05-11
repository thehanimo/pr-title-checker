import * as core from "@actions/core";
import * as github from "@actions/github";
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const issue_number = github.context.issue.number;
const { Octokit } = require("@octokit/action");

let octokit;
let  JIRA_TICKETS = []

// most @actions toolkit packages have async methods
async function run() {
  try {
    const { title, labels } = github.context.payload.pull_request;
    const getJiraTicketsFromPrTitle = ( ) => {
      const trimmedTitle=title.replaceAll("\\s","")
      JIRA_TICKETS  = trimmedTitle.split('-')[0].split('|')
      core.info( ` JIRA Ticket ${JIRA_TICKETS}`)
    }

    let pattern = /\d{4,5}/;
    const titleContainsJiraNumbers = pattern.test(title, "i");

    if (titleContainsJiraNumbers) {
      getJiraTicketsFromPrTitle()
      core.setOutput('JIRA_TICKETS', JIRA_TICKETS)
    } else {
      await addLabel('NotLinkedToJira')
      core.setOutput('JIRA_TICKETS', [])
    }

  } catch (error) {
    core.info(error);
  }
}

async function addLabel(name) {
  core.info(`Adding label (${name}) to PR...`);
  let addLabelResponse = await octokit.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [name],
  });
  core.info(`Added label (${name}) to PR - ${addLabelResponse.status}`);
}


try {
  octokit = new Octokit();
} catch (e) {
  handleOctokitError(e);
}

if (octokit) {
  run();
}
