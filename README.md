Pipedrive snapshot downloader & uploader
========================================

## Usage

This repository contains two scripts:

 * **download.js** - downloads/archives a nearly complete content of a Pipedrive account into a single archive

 * **upload.js** - uploads the contents of an archived Pipedrive account onto a new account


### Download.js

```
node download.js [apitoken] > backup.json
```

Downloads the contents from a Pipderive account using the supplied API token into backup.json file.

### Upload.js

```
node upload.js [apitoken] [filename]
```

Uploads the contents of a previously archived data from the given file (e.g. backup.json) to a Pipedrive account using the supplied API token.

