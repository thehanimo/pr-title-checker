# Extracting Jira Ticket number(s) from a Pull Request Title 

<!-- prettier-ignore -->
This action checks if PR titles contains Jira Ticket numbers :<br/>
1234-adding-a-style<br/>
2345|4567-certif-a-style : <br/>

## Create Workflow

Create a workflow (eg: `.github/workflows/pr-title-checker.yml` see [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)) to utilize the pr-title-checker action with content:

```yaml
name: "PR Title Checker"
on:
  pull_request_target:
    types:
      - opened
      - edited
      - synchronize
      - labeled
      - unlabeled

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: yanniser/extract-jira-tickets-from-pr-title@latest
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          pass_on_octokit_error: false
          configuration_path: ".github/pr-title-checker-config.json"
```
NOTE:
* [`pull_request_target`](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#pull_request_target) event trigger should be used (not [`pull_request`](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#pull_request)) in order to support checking PRs from forks. This was added in `v1.3.2`. See [#8](https://github.com/thehanimo/pr-title-checker/issues/8).
* `pass_on_octokit_error` is an optional input which defaults to false. Setting it to true will prevent the CI from failing when an octokit error occurs. This is useful when the environment this action is run in is not consistent. For e.g, it could be a missing GITHUB_TOKEN. Thanks to [@bennycode](https://github.com/bennycode) for pointing this out.

* `configuration_path` is also an optional input which defaults to `".github/pr-title-checker-config.json"`. If you wish to store your config file elsewhere, pass in the path here.
