Pipedrive snapshot downloader & uploader
========================================


## Usage

This repository contains two scripts:

 * **download.js** - downloads/archives a nearly complete content of a Pipedrive account into a single archive

 * **upload.js** - uploads the contents of an archived Pipedrive account onto a new account
---
## Important:

Due to deprecated API endpoints, please make sure your `/lib/objects.json:23` and `node_modules/pipedrive/lib/Pipedrive.js:63`
use `mailThreads` and not `emailThreads`!
---

### Download.js

```
node download.js [apitoken] [filename]
```

Downloads the contents from a Pipderive account using the supplied API token into a file.

### Upload.js

```
node upload.js [apitoken] [filename]
```

Uploads the contents of a previously archived data from the given file (e.g. backup.json) to a Pipedrive account using the supplied API token. **As of April 2016, uploader code is incomplete and does not work fully at all yet.**
