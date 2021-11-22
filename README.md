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
    "regexpFlags": "i",
    "ignoreLabels" : ["dont-check-PRs-with-this-label", "meta"]
  },
  "MESSAGES": {
    "success": "All OK",
    "failure": "Failing CI test",
    "notice": ""
  }
}
```
You can pass in one of `prefixes` or `regexp` or even both based on your use case. `regexpFlags` and `ignoreLables` are optional fields.

If none of the checks pass, a label will be added to that pull request. \
If at least one of them passes, the label will be removed.

This action causes CI tests to fail by default. However, if you don't want CI tests failing just because of this action, simply set `alwaysPassCI` as true in the CHECKS field.

Also, adding label names to the optional `ignoreLabels` field will forfeit any checks for PRs with those labels.

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
      - uses: thehanimo/pr-title-checker@v1.3.2
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          pass_on_octokit_error: false
          configuration_path: ".github/pr-title-checker-config.json"
```
NOTE:
* [`pull_request_target`](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#pull_request_target) event trigger should be used (not [`pull_request`](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#pull_request)) in order to support checking PRs from forks. This was added in `v1.3.2`. See [#8](https://github.com/thehanimo/pr-title-checker/issues/8).
* `pass_on_octokit_error` is an optional input which defaults to false. Setting it to true will prevent the CI from failing when an octokit error occurs. This is useful when the environment this action is run in is not consistent. For e.g, it could be a missing GITHUB_TOKEN. Thanks to [@bennycode](https://github.com/bennycode) for pointing this out.

* `configuration_path` is also an optional input which defaults to `".github/pr-title-checker-config.json"`. If you wish to store your config file elsewhere, pass in the path here.
