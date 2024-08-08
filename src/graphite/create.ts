import { Command } from "commander"
import { getConfigKey } from "../config/index.js"
import { getLinearClient } from "../linear/client.js"
import { spinner } from "@clack/prompts"
import { exec } from "node:child_process"

const createGraphitePrWithLinearIssueDetails = async (
  issueRef: string,
  options: { all: boolean },
) => {
  const defaultTeamKey = await getConfigKey("defaultLinearTeamKey")
  const s = spinner()

  s.start(`Looking for issue ${issueRef}`)

  const issueRegex = /^(?:([A-z0-9]+)-)?(\d+)$/

  const parsedIssue = issueRegex.exec(issueRef)

  const [_, teamKey = defaultTeamKey, issueNumber] = parsedIssue ?? [
    undefined,
    undefined,
    undefined,
  ]
  if (!issueNumber || !teamKey) {
    s.stop(`There was an error parsing the issue reference`, 1)
    return
  }

  const client = await getLinearClient()

  const [team] = (
    await client.teams({ filter: { key: { eqIgnoreCase: teamKey } } })
  ).nodes

  if (!team) {
    s.stop(`Team ${teamKey} not found in Linear workspace`, 1)
    return
  }

  const [issue] = (
    await team.issues({ filter: { number: { eq: parseInt(issueNumber) } } })
  ).nodes

  if (!issue) {
    s.stop(
      `Issue ${issueNumber} not found in team ${team.key} (${team.name})`,
      1,
    )
    return
  }

  s.stop(`Issue found: ${issue.identifier} - ${issue.title}`)

  exec(
    `gt create ${options.all ? "-a" : ""} --message="resolves ${issue.identifier} - ${issue.title}"`,
  )
}

export const createCommand = new Command("create")
  .alias("c")
  .description("Create a Graphite PR from a Linear issue")
  .argument("<issueId>", "The Linear issue ID")
  .option("-a, --all", "Stage all changed files before creating")
  .action((issueId, options) =>
    createGraphitePrWithLinearIssueDetails(issueId, options),
  )
