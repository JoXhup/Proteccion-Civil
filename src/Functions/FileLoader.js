import { pathToFileURL } from "url";
import { glob } from "glob";
import * as path from "path";
import chalk from "chalk";

async function importFile(filePath) {
  try {
    await import(pathToFileURL(filePath).href);
  } catch (error) {
    console.error(error);
    console.error(chalk.redBright(`[Error] ${filePath}: ${error}`));
  }
}

async function LoadFiles(dirName) {
  try {
    const files = await glob(
      path.join(process.cwd(), dirName, "**/*.js").replace(/\\/g, "/"),
    );
    const jsFiles = files.filter((file) => path.extname(file) === ".js");
    await Promise.all(jsFiles.map(importFile));
    return jsFiles;
  } catch (error) {
    console.error(chalk.redBright(`[Error] ${dirName}: ${error}`));
    throw error;
  }
}

export { LoadFiles };
