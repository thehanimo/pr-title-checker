# Pull Request Title Checker

This action checks if PR titles conform to the Contribution Guidelines :ballot_box_with_check: <br/><br/>
Consistent title names help maintainers organise their projects better :books: <br/><br/>
Shows if the author has _reaaaaally_ read the Contribution Guidelines :wink:

## Usage

Create a `.github/pr-title-styles.json` like this one below:

```json
{
  "LABEL": {
    "name": "title needs formatting",
    "color": "EEEEEE"
  },
  "CHECKS": {
    "prefixes": ["fix: ", "feat: "],
    "regexp": "docs\\(v[0-9]\\): "
  }
}
```

If none of the checks pass, a label will be added to that pull request. \
If at least one of them passes, the label will be removed.

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

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: thehanimo/pr-title-checker@v1.0.0
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
