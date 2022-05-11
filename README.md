# Extracting Jira Ticket number(s) from a Pull Request Title 

<!-- prettier-ignore -->
This action checks if PR titles contains Jira Ticket numbers :<br/>
1234-adding-a-style<br/>
2345|4567-certif-a-style : <br/>

## Create Workflow

Create a workflow (eg: `.github/workflows/pr-title-reader.yml` see [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)) to utilize the pr-title-checker action with content:

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
```
NOTE:
Output a number array called   JIRA_TICKETS
