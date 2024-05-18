import * as p from "@clack/prompts"
import { getConfig, setConfigKey } from "../config/index.js"
import { getLinearClient, testLinearApiKey } from "../linear/client.js"
import { Team } from "@linear/sdk"
import { Command } from "commander"

export const runSetup = async (): Promise<void> => {
  const currentConfig = await getConfig()

  const results = {
    ...currentConfig,
  }

  const getApiKey = () =>
    p.text({
      message: "Please enter your Linear API key",
      placeholder: "lin_api_xxxxxxx",
      defaultValue: results.linearApiKey,
    })

  const apiKey = await getApiKey()

  const keyValid = await testLinearApiKey(apiKey.toString())

  if (keyValid) {
    await setConfigKey("linearApiKey", apiKey.toString())
  }

  const getDefaultTeamKey = async (): Promise<string> => {
    const linearClient = await getLinearClient()
    const teams = await (await linearClient.viewer).teams()

    const [firstTeam, ...otherTeams] = teams.nodes

    if (!firstTeam) {
      throw new Error(
        "You are not in any Linear teams - please join or create one and try again",
      )
    } else if (otherTeams.length === 0) {
      return firstTeam.key
    } else {
      const selectedTeam = await p.select<
        { label: string; value: string }[],
        string
      >({
        message: "Please choose a default Linear team",
        options: teams.nodes.map((team: Team) => ({
          label: `${team.key} - ${team.name}`,
          value: team.key,
        })),
      })

      return selectedTeam.toString()
    }
  }

  const team = await getDefaultTeamKey()

  await setConfigKey("defaultLinearTeamKey", team)
}

export const setupCommand = new Command("setup")
  .description("Run setup")
  .action(() => runSetup())
