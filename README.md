# readmeio-sync
A tool for managing your `Readme.io` documentation locally.

[![Code Climate](https://codeclimate.com/github/mobify/readmeio-sync/badges/gpa.svg)](https://codeclimate.com/github/mobify/readmeio-sync)
[![Coverage Status](https://coveralls.io/repos/mobify/readmeio-sync/badge.svg?branch=master&service=github)](https://coveralls.io/github/mobify/readmeio-sync?branch=master)
[![npm version](https://badge.fury.io/js/readmeio-sync.svg)](https://badge.fury.io/js/readmeio-sync)

### 1) Tool Setup:

**For Regular Use:**
```
npm install -g readmeio-sync
```

**For Development & Testing:**

```
git clone git@github.com:mobify/readmeio-sync.git
cd readmeio-sync
npm link
cd ../<your_readmeio_project>
npm link readmeio-sync
```

### 2) Credential Setup:
This tool logs into Readme.io for you in order to upload files. For this to work, it needs your credentials!

The `README_EMAIL` and `README_PASSWORD` environment variables need to be set for `readmeio-sync` to know your credentials.

```bash
export README_EMAIL=<readmeio_account_email>
export README_PASSWORD=<readmeio_account_password>
```

### 3) Config Setup:
`readmeio-sync` differentiates between your production/staging projects using the `syncConfig.json` file.

You can set the name of these projects using the `config` command.

```
readmeio-sync config -s <staging-project-slug> -p <production-project-slug>
```
This will generate a `syncConfig.json` file with the proper keys set.

### 4) Project Initialization:
Initialization allows you to download all your existing content from Readme.io.

It also creates a new `syncPaths.json` file which represents the structure of your documentation and links to all your local content directories.

```
readmeio-sync init
```

This will use the `production` slug that you should have configured in step 3.

### 5) Project Upload:
Upload allows you to push updated content to Readme.io. This might include:

* New categories, docs or custom pages.
* Changes in content files.
* Changes to document titles or excerpts.
* Changes to the way you want to order content.
* New Slugs
* etc.

Once your project has been initialized and has a config, you can upload using the upload command.

```
readmeio-sync upload [--production]
```
Including the production flag will push the content to production.

### 6) Cleaning Readme.io:
When you remove content files, it does not auto-magically delete it from your Readmeio project too. **Upload only does updates and creates.**

If you have out of date content on your Readmeio project, you can use the `clean-remote` command to remove all content that is not specified in your filesystem.

```
readmeio-sync clean-remote [--production]
```

This will look at the state of your project, compare it to the state of your documentation, and delete whatever is not specified locally. This will be done for staging unless the production flag is set.

Sometimes 'ghost' documents can appear in Readme. These are documents that have been created but are no longer shown in the list of documentation. Since you can't see them in the list of documentation, they can't be deleted.

Additionally, attempting to create a new document with the same slug as a ghost doc will cause a document with a numbered slug to be created instead (eg. getting-started -> getting-started-1).

To make sure none of your docs have slugs associated to ghost documents, an `--aggressive` flag can be set.

When this flag is set, `readmeio-sync` will clean documents that only exist in Readme AND docs that only exist locally (and perhaps haven't been uploaded due to slug naming conflicts).

```
readmeio-sync clean-remote [--aggressive]
```

**Note**: If you remote clean a project and it removes all the documentation, Readmeio will not allow you to go into the documentation section. You will need to upload new content with the `readmeio-sync upload` command to get it working again.)*


------
## The Sync Paths File
`readmeio-sync` tracks all your content using the `syncPaths.json` file. This file is created during initialization.

Here is an example `syncPaths.json` file:

```json
{
    "adaptivejs-staging": {
        "v2.0": {
            "documentation": "adaptivejs-staging/v2.0/documentation",
            "customPages": "adaptivejs-staging/v2.0/customPages",
            "customContent": {
                "appearance": {
                    "html_body": "adaptivejs-staging/v2.0/customContent/appearance/landing_page.html",
                    "stylesheet": "adaptivejs-staging/v2.0/customContent/appearance/styles.css"
                }
            }
        },
        "v1.0": {
            "documentation": "adaptivejs-staging/v1.0/documentation",
            "customPages": "adaptivejs-staging/v1.0/customPages",
            "customContent": {
                "appearance": {
                    "html_body": "adaptivejs-staging/v1.0/customContent/appearance/landing_page.html",
                    "stylesheet": "adaptivejs-staging/v1.0/customContent/appearance/styles.css"
                }
            }
        }
    }
}
```
### Explanation of the Sections

#### Project Root
The top level key is the slug for the project the registry is representing.

```json
"adaptivejs-staging": {...}
```

#### Versions
Within the top level object are all the hosted versions of the documentation.

*This tool is currently not capable of creating new versions. You will need to ensure any versions listed in this file already exist on readme.io*

```json
"adaptive-restructing-test": {
	"v2.0": {...},
	"v1.0": {...}
}
```

#### Documentation
Each version has a documentation field, which holds a path to the folder where the documentation is contained.

```json
"v2.0": {
	"documentation": "adativejs-staging/v2.0/documentation",
	...
},
...
```

##### Documentation Folder Structure
Documentation is automatically extracted from your filesystem. All you need to do is provide the path to the directory where the documentation for that version is.

The directory should have the following structure:

```
- <root_folder>
    - <category_order_#>-<category_title>
        * <document_order_#>-<document_title>.md
        * ...
    - ...
```

**Example:**

```
- documentation
    - 1-Category 1
        * 1-Document 1.md
        * 2-Document 2.md
        * ...
    - 2-Category 2
        * 1-Document 1.md
        * 2-Document 2.md
        * ...
    - ...
```

\* = File  
\- = Directory

The order numbers where determine the order that the documents/categories are organized.

If you don't want a document to be uploaded, remove the order number from the beginning of its name.

##### Document File Structure
Readmeio-sync does special parsing of your markdown files to:

1. Extract metadata (excerpt and custom slug)
1. Code block conversion

**Example Documentation File:**

```
excerpt: This is the description of your doc.
slug: important-doc

# Content!

 ` ``javascript
 	// This code block will get converted to readmeio format!

 	var foo = 'bar';
 ` ``
```

Make sure to include an `excerpt` and `slug` descriptor at the top of all your files, followed by a newline.


#### Custom Pages
Each version will have a section for custom pages. `customPages` is a path to the folder where custom page (html) files are contained.

*(Currently there is a Readme.io bug which does not allow versioned pages. As such, only use one custom pages section for all versions.)*

```json
"v2.0": {
	"customPages": "adaptivejs-staging/v2.0/customPages"
	...
}
...

```

##### Custom Page Folder Structure
Custom pages are extracted from the specified directory. In the directory, your custom pages should be specified like so:

```
- <root_folder>
	* <page_title>.html
	* ...
```

**Example:**

```
- customPages
	* FirstCustomPage.html
	* SecondCustomPage.html
	* ...
```

\* = File<br>
\- = Directory


#### Custom Content
The custom content object let's you upload a stylesheet (Dashboard > Appearance > Custom Stylesheet) as well as html for the landing page (Dashboard > Appearance > Landing Page (Body Content)).

```json
"v2.0": {
	"customContent": {
		"selector": ".c-readme-body",
		"appearance": {
			"html_body": "www/index.html",
			"stylesheet": "www/css/main.css"
		}
	}
}
...

```
- `selector` (Optional): Can be used to select a subset of the html specified in the html_body file
- `appearance`: Necessary object expected by the api
- `html_body`: Path to the landing page html file
- `stylesheet`: Path to a css stylesheet

---------
### [Known Issues](https://github.com/mobify/readmeio-sync/issues)

1. Doing a remote-clean when you have no documentation in your `syncPaths.json` file will cause all your documentation on readme.io to be deleted (after all, you are saying "delete all the things I don't have specified locally"...which is nothing!). Having no documentation causes Readme.io to break (you can't enter the documentation section of the site). To fix this you will have to add a document to your `syncPaths.json` and upload it...or get in contact with Readme.io and admit you were using internal APIs (OOPS!).

1. Custom pages are not versioned. Ideally they would be, and that's why the "customPages" section exists in each version of the `syncPaths.json`. When you initialize a project, the same custom pages will be downloaded for both versions and specified separately in the `syncPaths.json`. If you try and upload while the pages are specified in both versions, duplicates will be created. <br/><br/> **You can fix this by:**
<br />1. Deleting all the custom pages in all versions except one (however if you `clean-remote` with this configuration, all custom pages will be deleted and you'll have to upload again). <br/>2. `clean-remote` after each upload.

1. This tool is still in beta and may burn your project to the ground. Test it out, log issues, submit PRs.
