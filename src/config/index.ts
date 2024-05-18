import { readFile, writeFile } from "fs/promises"
import { type } from "arktype"
import * as os from "node:os"
import { runSetup } from "../cli/setup.js"

const gtlnConfig = type({
  "linearApiKey?": "string",
  "defaultLinearTeamKey?": "string",
})

type GtlnConfig = typeof gtlnConfig.infer

const homedir = os.homedir()
const CONFIG_FILE_PATH = `${homedir}/.gtln/config.json`

const parseConfig = type("string").pipe((s) => JSON.parse(s), gtlnConfig)

export const getConfig = async (): Promise<GtlnConfig> => {
  const fileContents = await readConfigFile()
  const str = fileContents.toString()

  const parsed = parseConfig(str)

  if (parsed instanceof type.errors) {
    throw new Error(parsed.summary)
  }

  return parsed
}

export const getConfigKey = async <K extends keyof GtlnConfig>(
  key: K,
): Promise<GtlnConfig[K]> => {
  const currentConfig = await getConfig()

  return currentConfig[key]
}

export const setConfigKey = async <K extends keyof GtlnConfig>(
  key: K,
  value: GtlnConfig[K],
) => {
  const currentConfig = await getConfig()

  const newConfig = gtlnConfig({ ...currentConfig, [key]: value })

  if (newConfig instanceof type.errors) {
    throw new Error(newConfig.summary)
  }

  await writeFile(CONFIG_FILE_PATH, JSON.stringify(newConfig))
}

const createConfigFile = (initialConfig: Partial<GtlnConfig>) =>
  writeFile(CONFIG_FILE_PATH, JSON.stringify(initialConfig))

const readConfigFile = async () => {
  try {
    return await readFile(CONFIG_FILE_PATH)
  } catch (e: unknown) {
    console.log("error reading config file, trying to create one")
    await createConfigFile({})
    await runSetup()
    return readFile(CONFIG_FILE_PATH)
  }
}
