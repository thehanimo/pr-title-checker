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
    "ignoreLabels" : ["dont-check-PRs-with-this-label", "meta"],
    "alwaysPassCI": false
  },
  "MESSAGES": {
    "success": "All OK",
    "failure": "Failing CI test",
    "notice": ""
  }
}
```
You can pass in one of `prefixes` or `regexp` or even both based on your use case. `regexpFlags` and `ignoreLabels` are optional fields.

### Config reference

| Field | Required | Default | Description |
|---|---|---|---|
| `LABEL.name` | no | `""` | Label added to PRs whose title fails the check, and removed once it passes. `""` disables labelling. |
| `LABEL.color` | no | `"eee"` | Label color as a hex code without `#` (e.g. `"ff0000"`). Color names like `red` are not supported. If the label already exists, its color is updated to match. |
| `CHECKS.prefixes` | one of `prefixes`/`regexp` | — | List of allowed title prefixes (case-sensitive). The title passes if it starts with any of them. |
| `CHECKS.regexp` | one of `prefixes`/`regexp` | — | A JavaScript regular expression (as a string, so backslashes must be escaped). The title passes if it matches. |
| `CHECKS.regexpFlags` | no | `""` | Flags for `regexp`, e.g. `"i"` for case-insensitive. |
| `CHECKS.ignoreLabels` | no | `[]` | PRs with any of these labels skip the check and pass. |
| `CHECKS.alwaysPassCI` | no | `false` | If `true`, a failing title adds the label but does not fail the job. |
| `MESSAGES.success` | no | `"All OK"` | Logged when the title passes. |
| `MESSAGES.failure` | no | `"Failing CI test"` | Shown when the title fails. Use it to tell contributors the expected format or link to your guidelines. |
| `MESSAGES.notice` | no | `""` | If set, shown as a notice annotation when the title fails. |

When a title fails, the log also lists the prefixes and regexp it was checked against.

If `LABEL.name` is set to `""`, adding or removing labels will be skipped. The CI test will continue to pass/fail accordingly.

If none of the checks pass, a label will be added to that pull request. \
If at least one of them passes, the label will be removed.

This action causes CI tests to fail by default. However, if you do not want CI tests failing just because of this action, simply set `alwaysPassCI` as true in the CHECKS field. **An invalid config file will always cause the action to fail.**

Adding label names to the optional `ignoreLabels` field will forfeit any checks for PRs with those labels.

By default, the config file is read from the commit the workflow runs on. With the recommended `pull_request_target` trigger, that is the latest commit on the PR's **base** branch, so a PR cannot change the config used to check itself.

See [other ways to specify config file.](#other-ways-to-specify-config-file)

Action returns a single output: `success` that indicates if check has passed or failed.

## Create Workflow

Create a workflow file (eg: `.github/workflows/pr-title-checker.yml`) with the following content:

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
      - uses: thehanimo/pr-title-checker@v2.0.0
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          pass_on_octokit_error: false
          configuration_path: .github/pr-title-checker-config.json #(optional. defaults to .github/pr-title-checker-config.json)
```

To learn more about workflows, see [Create an example workflow.](https://docs.github.com/en/actions/using-workflows/about-workflows#create-an-example-workflow)

## Other ways to specify config file

### 1. Remote URL to a valid JSON file
```yaml
...
    steps:
      - uses: thehanimo/pr-title-checker@v2.0.0
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          pass_on_octokit_error: false
          remote_configuration_url: "https://raw.githubusercontent.com/grpc/grpc/master/.github/pr_title_checker_config.json"
...
```
Note that this has to be a url pointing to a valid, raw json file. See [#28](https://github.com/thehanimo/pr-title-checker/issues/28)

### 2. Config file in a GitHub repo
```yaml
...
    steps:
      - uses: thehanimo/pr-title-checker@v2.0.0
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          pass_on_octokit_error: false
          github_configuration_owner: RocketChat #(optional. defaults to the owner of the repo in which the action is run)
          github_configuration_repo: Rocket.Chat #(optional. defaults to the repo in which the action is run)
          github_configuration_path: .github/pr-title-checker-config.json #(optional. defaults to .github/pr-title-checker-config.json)
          github_configuration_ref: <named branch, tag, or SHA> #(optional. defaults to the latest commit on the default branch or, if the repo specified is the same as the one on which the action is running, it defaults to the current context's sha)
          github_configuration_token: ${{ secrets.YOUR_TOKEN }} #(optional. defaults to GITHUB_TOKEN)
...
```

### 3. Config file in the local file system of the action
```yaml
...
    steps:
      - uses: thehanimo/pr-title-checker@v2.0.0
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          pass_on_octokit_error: false
          local_configuration_path: .github/actions/enforce-pr-titles/config.json
...
```
This is useful if a repo containing the config file is pulled in a previous step using, for e.g., actions/checkout. See [#36](https://github.com/thehanimo/pr-title-checker/issues/36)

Relative paths are resolved against the working directory; absolute paths are used as-is. This lets a composite action ship its own config, e.g. `local_configuration_path: ${{ github.action_path }}/pr-title-checker-config.json`. See [#47](https://github.com/thehanimo/pr-title-checker/issues/47)

### Different checks per target branch

Use separate steps with `if` conditions to pick a config based on the PR's base branch. See [#45](https://github.com/thehanimo/pr-title-checker/issues/45)

```yaml
...
    steps:
      - uses: thehanimo/pr-title-checker@v2.0.0
        if: github.base_ref == 'main'
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          configuration_path: .github/pr-title-checker-config.main.json
      - uses: thehanimo/pr-title-checker@v2.0.0
        if: github.base_ref != 'main'
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          configuration_path: .github/pr-title-checker-config.json
...
```

### Using output result

You can use the action output to execute follow up steps e.g. adding a comment.

```yml
    steps:
      - uses: thehanimo/pr-title-checker@v2.0.0
        id: check
        continue-on-error: true
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          pass_on_octokit_error: false
      
      - name: Add comment to fix PR title
        uses: marocchino/sticky-pull-request-comment@v2
        if: ${{ steps.check.outputs.success == 'false'}}
        with:
          header: 'PR Title Check'
          recreate: true
          message: |
              ### 🚨 PR Title Needs Formatting
              The title of this PR needs to be formatted correctly and include an Azure Boards Reference. 
              Please update the title to match the format `type: description AB#xxx`. Examples:
              * `bugfix: fix typo in README.md AB#123`
              * `chore: update dependencies AB#456`
              * `feat: add new feature AB#789`
              * `chore: fixing build pipeline` - no AB reference

      - name: Add comment that PR title is fixed
        if: ${{ steps.check.outputs.success == 'true'}}
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: 'PR Title Check'
          recreate: true
          message: |
              ### ✅ PR Title Formatted Correctly
              The title of this PR has been updated to match the correct format. Thank you!
```

## NOTE:
* [`pull_request_target`](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#pull_request_target) event trigger should be used (not [`pull_request`](https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#pull_request)) in order to support checking PRs from forks. This was added in `v1.3.2`. See [#8.](https://github.com/thehanimo/pr-title-checker/issues/8)
* `pass_on_octokit_error` is an optional input which defaults to false. Setting it to true will prevent the CI from failing when an octokit error occurs. This is useful when the environment this action is run in is not consistent. For e.g, it could be a missing GITHUB_TOKEN. Thanks to [@bennycode](https://github.com/bennycode) for pointing this out.
