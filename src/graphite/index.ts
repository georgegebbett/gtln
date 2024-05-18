import { exec } from "node:child_process"

const isGraphiteInstalled = (): Promise<boolean> => {
  return new Promise((resolve) => {
    exec("which gt", (error) => {
      if (error) {
        resolve(false)
        return
      }
      resolve(true)
    })
  })
}

export const ensureGraphiteInstalled = () => isGraphiteInstalled()
