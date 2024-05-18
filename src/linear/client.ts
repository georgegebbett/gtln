import { LinearClient } from "@linear/sdk"
import { getConfig } from "../config/index.js"

export const getLinearClient = async () => {
  const { linearApiKey } = await getConfig()

  if (!linearApiKey) {
    console.error("No stored API key, run setup")
  }

  return new LinearClient({
    apiKey: linearApiKey,
  })
}

export const testLinearApiKey = async (apiKey: string) => {
  try {
    const testClient = new LinearClient({
      apiKey,
    })
    await testClient.viewer
    return true
  } catch (e: unknown) {
    return false
  }
}
