import { program } from "./cli/index.js"
import { ensureGraphiteInstalled } from "./graphite/index.js"

const runCli = async () => {
  const graphiteInstalled = await ensureGraphiteInstalled()

  if (!graphiteInstalled) {
    throw new Error("Graphite not installed")
  }

  await program.parseAsync(process.argv)
}

await runCli()
