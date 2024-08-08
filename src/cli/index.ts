import { Command } from "commander"
import { setupCommand } from "./setup.js"
import { createCommand } from "../graphite/create.js"
import packageJson from "../../package.json"

export const program = new Command()
  .name("gtln")
  .version(packageJson.version)
  .description("A tool to use Graphite with Linear")
  .addCommand(setupCommand)
  .addCommand(createCommand)
