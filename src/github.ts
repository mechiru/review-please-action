import { PaginateInterface, paginateRest } from '@octokit/plugin-paginate-rest'
import { throttling } from '@octokit/plugin-throttling'
import { Octokit } from '@octokit/rest'

// https://docs.github.com/en/rest/reference
type MyOctokit = Octokit & { paginate: PaginateInterface }

export type PrReviewer = {
  no: number
  url: string
  reviewerLogins: string[]
  reviewerTeamSlugs: string[]
}

export class Client {
  private readonly _opt: {
    owner: string
    repo: string
  }
  private readonly _octokit: MyOctokit

  public constructor(init: { owner: string; repo: string; auth: string }) {
    this._opt = init
    this._octokit = new (Octokit.plugin(paginateRest, throttling))({
      auth: init.auth,
      throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
          octokit.log.warn(
            `Request quota exhausted for request: ${JSON.stringify(options)}`
          )

          if (retryCount < 1) {
            // only retries once
            octokit.log.info(`Retrying after ${retryAfter} seconds!`)
            return true
          }
        },
        onSecondaryRateLimit: (retryAfter, options, octokit) => {
          // does not retry, only logs a warning
          octokit.log.warn(
            `SecondaryRateLimit detected for request: ${JSON.stringify(
              options
            )}`
          )
        }
      }
    })
  }

  public async createIssueComment(no: number, body: string) {
    await this._octokit.rest.issues.createComment({
      issue_number: no,
      body,
      ...this._opt
    })
  }

  public async getPrReviewers(): Promise<PrReviewer[]> {
    const prs = await this._octokit.paginate(
      `GET /repos/{owner}/{repo}/pulls`,
      {
        ...this._opt
      }
    )

    return prs.map(x => ({
      no: x.number,
      url: x.url,
      reviewerLogins: x.requested_reviewers?.map(x => x.login) ?? [],
      reviewerTeamSlugs: x.requested_teams?.map(x => x.slug) ?? [],
      // TODO: export create/update time for filter feature.
      createdAt: x.created_at,
      updatedAt: x.updated_at,
    }))
  }
}
