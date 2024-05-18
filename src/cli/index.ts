import { Command } from "commander"
import { setupCommand } from "./setup.js"
import { createCommand } from "../graphite/create.js"

export const program = new Command()
  .name("gtln")
  .description("A tool to use Graphite with Linear")
  .addCommand(setupCommand)
  .addCommand(createCommand)
