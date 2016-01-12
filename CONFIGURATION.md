# Configuration

1. [The Sync Paths File](#the-sync-paths-file)
2. [The Sync Config File](#the-sync-config-file)

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

## The Sync Config File

`readmeio-sync` allows you to specify a docs staging project so that you can test out your changes. To tell `readmeio-sync` about the different projects a `syncConfig.json` is used. This file holds the slugs for both your staging and production projects.

**Example `syncConfig.json`**
```json
{
    "projectNames": {
        "staging": "readme-io-sync",
        "production": "readme-io-sync"
    }
}
```

Although editing this file by hand works, `readmeio-sync config [-s <staging-slug>] [-p <production-slug]` is a convenience command for updating these values.
