# Pull Request Title Checker

<!-- prettier-ignore -->
This action checks if PR titles conform to the Contribution Guidelines :ballot_box_with_check: <br/><br/>
Consistent title names help maintainers organise their projects better :books: <br/><br/>
Shows if the author has _reaaaaally_ read the Contribution Guidelines :P

## Usage

Create a config file `.github/pr-title-checker-config.json` like this one below:

```json
{
  "LABEL": {
    "name": "title needs formatting",
    "color": "EEEEEE"
  },
  "CHECKS": {
    "prefixes": ["fix: ", "feat: "],
    "regexp": "docs\\(v[0-9]\\): ",
    "ignoreLabels" : ["dont-check-PRs-with-this-label", "meta"]
  }
}
```

If none of the checks pass, a label will be added to that pull request. \
If at least one of them passes, the label will be removed.

This action causes CI tests to fail by default. However, if you don't want CI tests failing just because of this action, simply set `alwaysPassCI` as true in the CHECKS field.

Also, adding label names to the optional `ignoreLabels` field will forfeit any checks for PRs with those labels.

## Create Workflow

Create a workflow (eg: `.github/workflows/pr-title-cheker.yml` see [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)) to utilize the pr-title-checker action with content:

```
name: "PR Title Checker"
on:
  pull_request:
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
      - uses: thehanimo/pr-title-checker@v1.2
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
