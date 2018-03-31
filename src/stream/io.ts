import path = require('path')
import { Stream, Writable } from 'stream'

export function getFileIO(baseDir: string) {
  const SPECS_FOLDER = `${baseDir}${path.sep}specs`
  const fs = require('fs')

  return {
    createReadStream(id: string): Stream {
      const filePath = path.resolve(SPECS_FOLDER, id)
      return fs.createReadStream(filePath)
    },
    createWriteStream(id: string): Writable {
      const filePath = path.resolve(SPECS_FOLDER, id)
      const folder = path.dirname(filePath)
      // istanbul ignore next
      if (!fs.existsSync(folder))
        createFolders(folder)
      return fs.createWriteStream(filePath)
    }
  }
  // istanbul ignore next
  function createFolders(location: string) {
    const sep = path.sep;
    const initDir = path.isAbsolute(location) ? sep : '';
    location.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(parentDir, childDir);
      try {
        if (!fs.existsSync(curDir))
          fs.mkdirSync(curDir);
      }
      catch (err) {
        if (err.code !== 'EEXIST') {
          // istanbul ignore next
          throw err;
        }

        // log.info(`Directory ${curDir} already exists!`);
      }

      return curDir;
    }, initDir);
  }
}
