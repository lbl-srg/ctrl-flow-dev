# Contributing

## Formatting

Make sure the [prettier](https://prettier.io/) extension is installed and configured to format on save. If using VS Code, the [`.vscode`](../.vscode) folder and settings is already included with the repo.

## Branching Strategy

- Branch off `staging` 
- use your initials when naming the branch. I use this format:

```
<your-initials>/<issue-number>-<short-specific-description>
e.g. dk/14-input-onblur
```

- Try and keep branches focused on a single task
- They shouldn't be long lived (no more than a few days)
- Develop and test your changes locally, when you are satisfied open a PR to the `staging` branch. After review merge your branch into `staging`. Your code will be deployed to the staging environment
- If everything looks good on staging, create a pull request from `staging` to `main` branch
- Once the PR is approved and merged into `main`, your changes will be automatically deployed to production

## Pull Requests

- Opening draft PRs early is encouraged. This gives the work visibility, and a place to document discussion around the change
- Get a separate set of eyes for review (if possible)
- In the description make sure each functional change is listed. There shouldn't be any surprises in the diffs
- DO squash on merge
