import * as github from '@actions/github';
import * as core from '@actions/core';
import { readFileSync } from 'fs';
import { join } from 'path';

const context = github.context;
let octokit: ReturnType<typeof github.getOctokit>;

type ConfigType = {
  LABEL: {
    name: string;
    color: string;
  };
  CHECKS: {
    ignoreLabels: string[];
    regexp: string;
    regexpFlags: string;
    prefixes: string[];
    alwaysPassCI: boolean;
  };
  MESSAGES: {
    success: string;
    failure: string;
    notice: string;
  }
};


async function titleCheckFailed({ config: { MESSAGES, LABEL, CHECKS } }: { config: ConfigType }) {
  try {
    if (MESSAGES.notice.length) {
      core.notice(MESSAGES.notice);
    }

    await addLabel({ name: LABEL.name });

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

async function createLabel({ label: { name, color } }: { label: ConfigType['LABEL'] }) {
  if (name === '') {
    return;
  }

  try {
    core.info(`Creating label (${name})...`);
    let createResponse = await octokit.rest.issues.createLabel({
      owner: context.repo.owner,
      repo: context.repo.repo,
      name: name,
      color: color,
    });
    core.info(`Created label (${name}) - ${createResponse.status}`);
  } catch (error) {
    // Might not always be due to label's existence
    core.info(`Label (${name}) already created.`);
  }
}

async function addLabel({ name }: { name: string }) {
  if (name === '') {
    return;
  }

  core.info(`Adding label (${name}) to PR...`);
  const addLabelResponse = await octokit.rest.issues.addLabels({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    labels: [name],
  });

  core.info(`Added label (${name}) to PR - ${addLabelResponse.status}`);
}

async function removeLabel({ labels, name }: { name: string; labels: ConfigType['LABEL'][] }) {
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
    let removeLabelResponse = await octokit.rest.issues.removeLabel({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      name: name,
    });
    core.info(`Removed label - ${removeLabelResponse.status}`);
  } catch (error) {
    core.info(`Failed to remove label (${name}) from PR: ${error}`);
  }
}

async function getJSON({ path, useLocalConfigFile }: { path: string; useLocalConfigFile: boolean; }) {
  if (useLocalConfigFile) {
    const data = readFileSync(join(process.cwd(), path));
    return data.toString();
  }

  const response = await octokit.rest.repos.getContent({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path,
    ref: context.sha,
  });

  return Buffer.from((response.data as any).content, (response.data as any).encoding).toString();
}

async function handleOctokitError({ passOnOctokitError, error }: { passOnOctokitError: boolean, error: Error }) {
  core.info(`Octokit Error - ${error}`);
  if (passOnOctokitError) {
    core.info("Passing CI regardless");
  } else {
    core.setFailed("Failing CI test");
  }
}

const run = async ({
  configPath,
  useLocalConfigFile
}: {
  configPath: string;
  useLocalConfigFile: boolean;
}) => {
  if (!context || !context.payload || !context.payload.pull_request) {
    return;
  }

  try {
    const title = context.payload.pull_request.title;
    const labels = context.payload.pull_request.labels;

    let config: ConfigType;
    try {
      const configString = await getJSON({ path: configPath, useLocalConfigFile });
      config = JSON.parse(configString);
    } catch (e) {
      core.setFailed(`1 Couldn't retrieve or parse the config file specified - ${e}`);
      return;
    }

    let { CHECKS, LABEL, MESSAGES } = config;
    LABEL = LABEL || {} as ConfigType['LABEL'];
    LABEL.name = LABEL.name || "";
    LABEL.color = LABEL.color || "eee";
    CHECKS.ignoreLabels = CHECKS.ignoreLabels || [];
    MESSAGES = MESSAGES || {} as ConfigType['MESSAGES'];
    MESSAGES.success = MESSAGES.success || "All OK";
    MESSAGES.failure = MESSAGES.failure || "Failing CI test";
    MESSAGES.notice = MESSAGES.notice || "";

    for (let i = 0; i < labels.length; i++) {
      for (let j = 0; j < CHECKS.ignoreLabels.length; j++) {
        if (labels[i].name == CHECKS.ignoreLabels[j]) {
          core.info(`Ignoring Title Check for label - ${labels[i].name}`);
          removeLabel({ labels, name: LABEL.name });
          return;
        }
      }
    }

    await createLabel({ label: LABEL });

    if (CHECKS.prefixes && CHECKS.prefixes.length) {
      for (let i = 0; i < CHECKS.prefixes.length; i++) {
        if (title.startsWith(CHECKS.prefixes[i])) {
          removeLabel({ labels, name: LABEL.name });
          core.info(MESSAGES.success);
          return;
        }
      }
    }

    if (CHECKS.regexp) {
      let re = new RegExp(CHECKS.regexp, CHECKS.regexpFlags || "");
      if (re.test(title)) {
        removeLabel({ labels, name: LABEL.name });
        core.info(MESSAGES.success);
        return;
      }
    }

    await titleCheckFailed({ config });
  } catch (error) {
    core.info(error);
  }
}

const configPath = core.getInput("configuration_path")!;
const useLocalConfigFile = core.getInput("use_local_configuration_file") === "true";
const passOnOctokitError = core.getInput("pass_on_octokit_error") === "true";
const token = core.getInput('GITHUB_TOKEN');

try {
  octokit = github.getOctokit(token)
} catch (e) {
  handleOctokitError({ passOnOctokitError, error: e });
}

run({ configPath, useLocalConfigFile })
