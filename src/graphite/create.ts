import { Command } from "commander"
import { getConfigKey } from "../config/index.js"
import { getLinearClient } from "../linear/client.js"
import { select, spinner } from "@clack/prompts"
import { spawn } from "node:child_process"

const createGraphitePrWithLinearIssueDetails = async (
  issueRef: string,
  options: { all: boolean; prefix?: string },
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

  let commitPrefix = options.prefix
  if (!commitPrefix) {
    // Prompt user to select a conventional commit prefix if not provided
    const prefixOptions = [
      { value: "feat", label: "feat: A new feature" },
      { value: "fix", label: "fix: A bug fix" },
      { value: "docs", label: "docs: Documentation only changes" },
      {
        value: "style",
        label: "style: Changes that do not affect the meaning of the code",
      },
      {
        value: "refactor",
        label:
          "refactor: A code change that neither fixes a bug nor adds a feature",
      },
      { value: "perf", label: "perf: A code change that improves performance" },
      {
        value: "test",
        label: "test: Adding missing tests or correcting existing tests",
      },
      {
        value: "chore",
        label:
          "chore: Changes to the build process or auxiliary tools and libraries",
      },
    ]

    commitPrefix = (await select({
      message: "Select a conventional commit prefix:",
      options: prefixOptions,
    })) as string | undefined
  }

  const commitMessage = `${commitPrefix}: ${issue.title} - resolves ${issue.identifier}`

  const gtProcess = spawn(
    "gt",
    ["create", ...(options.all ? ["-a"] : []), `--message=${commitMessage}`],
    {
      stdio: "inherit", // This will direct the output of the command to the current process's stdout/stderr
    },
  )

  // Listen for the 'close' event to detect when the command has finished
  gtProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`gt create command exited with code ${code}`)
    }
  })
}

export const createCommand = new Command("create")
  .alias("c")
  .description("Create a Graphite PR from a Linear issue")
  .argument("<issueId>", "The Linear issue ID")
  .option("-a, --all", "Stage all changed files before creating")
  .option("-p, --prefix <prefix>", "Specify a conventional commit prefix")
  .action((issueId, options) =>
    createGraphitePrWithLinearIssueDetails(issueId, options),
  )
