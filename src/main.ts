import * as core from '@actions/core'
import { Client, PrReviewer } from './github'

type Input = Readonly<{
  auth: string
  owner: string
  repo: string
}>

function parseInput(init?: Partial<Input>): Input {
  return {
    auth: core.getInput('github-token'),
    owner: core.getInput('owner'),
    repo: core.getInput('repo')
  }
}

export async function run(): Promise<void> {
  try {
    const input = parseInput()

    const client = new Client(input)

    const prs = await client.getPrReviewers()

    for (const pr of prs) {
      const comment = toComment(input.owner, pr)
      await client.createIssueComment(pr.no, comment)
    }

    core.setOutput('prs', JSON.stringify(prs))
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

export function toComment(owner: string, pr: PrReviewer): string {
  const reviewerLogins = pr.reviewerLogins.map(x => `@${x}`).join(', ')
  const reviewerTeams = pr.reviewerTeamSlugs.map(x => `@${owner}/${x}`).join(', ') ?? ''

  return `${reviewerLogins.length > 0 ? `Requested reviewers:\n${reviewerLogins}\n\n` : ''}\
${reviewerTeams.length > 0 ? `Requested teams:\n${reviewerTeams}\n\n` : ''}\
url: ${pr.url}
Please review!!`
}
