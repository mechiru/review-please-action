# Review Plaase

TODO

```yaml
name: review-please

on:
  schedule:
    # https://pubs.opengroup.org/onlinepubs/9699919799/utilities/crontab.html#tag_20_25_07
    - cron: '0 0 * * 1'
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  review-please:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: mechiru/review-please-action@main

```
