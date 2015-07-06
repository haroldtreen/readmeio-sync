# readmeio-sync
A tool for making local Readme.io development a breeze!

### 1) Tool Setup:
When readmeio-sync becomes available on npm, this process will be less 'linky'.

```
git clone git@github.com:mobify/readmeio-sync.git
cd readmeio-sync
npm link
cd ../<your_readmeio_project>
npm link readmeio-sync
```

### 2) Credential Setup:
The script will log into Readme.io for you in order to upload files. For this to work, it needs your credentials!

Tell `readmeio-sync` your credentials by setting the following environment variables like so.

```
export README_EMAIL=<readmeio_account_email>
export README_PASSWORD=<readmeio_account_password>
```

### 3) Config Setup:
`readmeio-sync` differentiates between your production/staging projects through the `syncConfig.json` file.

You can set the name of these projects using the `config` command.

```
readmeio-sync config -s <staging-project-slug> -p <production-project-slug>
```
This will generate the `syncConfig.json` file with the proper keys set.

### 4) Project Initialization:
Initialization allows you to download all your existing content from Readme.io. 

It also creates a new `syncRegistry.json` file which represents the structure of your documenation and links to all your local content files.

Initialize using the `init` command.

```
readmeio-sync init
```

This will use the `production` slug that you should have configured in step 3.

### 5) Project Upload:
Upload allows you to push updated content to Readme.io. This might include:

* New categories, docs or custom pages you've added to the registry files.
* Changes in content files.
* Changes to document titles or excerpts.
* Changes to the way you want to order content.
* etc.

Once your project has been initialized and has a config, you can upload using the upload command.

```
readmeio-sync upload [--production]
```
Including the production flag will push the content to production.

### 6) Remote Clean:
When you remove content from your registry file, it does not auto-magically delete it from your Readmeio project too. Upload only does updates and creates.

If you have out of date content on your Readmeio project, you can use the `remote-clean` command to remove all content that is not specified in your registry file.

```
readmeio-sync remote-clean [--production]
```

This will look at the state of your project, compare it to the state of your registry, and delete whatever is not specified locally. This will be done for staging unless the production flag is set.

*(**Note**: If you remote clean a project and it removes all the documentation, Readmeio will not allow you to go into the documentation section. You will need to upload new content with the `readmeio-sync upload` command to get it working again.)*



------
## The Registry File
`readmeio-sync` tracks all your content using the `syncRegistry.json` file. This file is created during initialization. 

Here is an example registy file:

```json
{
    "adaptive-restructing-test": {
        "v1.0": {
            "documentation": [
                {
                    "title": "Overview",
                    "pages": [
                        {
                            "body": "adaptive-restructing-test/v1.0/documentation/Overview/What is Adaptive.js?.md",
                            "excerpt": "Documentation page description!",
                            "title": "What is Adaptive.js?",
                            "slug": "what-is-adaptivejs"
                        },
                        {
                            "body": "adaptive-restructing-test/v1.0/documentation/Overview/How Does Adaptive.js Work?.md",
                            "excerpt": "Adaptive.js transforms your site via the Mobify tag.",
                            "title": "How Does Adaptive.js Work?",
                            "slug": "how-does-adaptivejs-work"
                        }
                    ],
                    "slug": "overview"
                },
                {
                    "title": "Getting Started",
                    "pages": [
                        {
                            "body": "adaptive-restructing-test/v1.0/documentation/Getting Started/Quick Start.md",
                            "excerpt": "Experience Adaptive.js in action in 5 - 10 minutes!",
                            "title": "Quick Start",
                            "slug": "quick-start"
                        },
                        {
                            "body": "adaptive-restructing-test/v1.0/documentation/Getting Started/Video Get Started.md",
                            "excerpt": "See a 3-minute video of a sample mobile site adaptation done with Adaptive.js!",
                            "title": "Video Get Started",
                            "slug": "video-get-started"
                        },
                        {
                            "body": "adaptive-restructing-test/v1.0/documentation/Getting Started/Scroll-Down Get Started.md",
                            "excerpt": "Another draft for a start-to-finish Get Started article.",
                            "title": "Scroll-Down Get Started",
                            "slug": "scroll-down-get-started"
                        }
                    ],
                    "slug": "getting-started"
                }
            ],
            "customPages": [
                {
                    "title": "Adapting Desktop Markup",
                    "html": "www/categories/adapting-desktop-markup.html",
                    "selector": ".c-readme-body",
                    "slug": "adapting-desktop-markup"
                },
                {
                    "title": "Adding Interactivity",
                    "html": "www/categories/adding-interactivity.html",
                    "selector": ".c-readme-body",
                    "slug": "adding-interactivity"
                }
            ],
            "customContent": {
                "selector": ".c-readme-body",
                "appearance": {
                    "html_body": "www/index.html",
                    "stylesheet": "www/css/main.css"
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
"adaptive-restructing-test": {...}
```

### Versions
Within the top level object are all the hosted versions of the documentation.

```json
"adaptive-restructing-test": {
	"v2.0": {...},
	"v1.0": {...}
}
```

### Documentation
Each version has a documentation object, which is an array of categories.

```json
"v2.0": {
	"documentation": [
    	{
			"title": "Overview",
			"pages": [...],
		},
		{
			"title": "Getting Started",
			"pages": [...]
		}
	],
	...
}
...
```

### Category Pages
Each category has as array of page objects.

```json
{
	"title": "Overview",
	"pages": [
		{
			"body": "adaptive-restructing-test/v1.0/documentation/Overview/What is Adaptive.js?.md",
			"excerpt": "Documentation page description!",
			"title": "What is Adaptive.js?"
		}
	]
}
```
- `body`: Path to the documentation content (written in Readme.io flavored Markdown)
- `excerpt`: Description of the document
- `title`: Title of the document

### Custom Pages
Each version will have a section for custom pages. `customPages` is an array of objects representing custom pages.

*(Currently there is a Readme.io bug which does not allow versioned pages. As such, only use one custom pages section for all versions.)*

```json
"v2.0": {
	"customPages": [
    	{
			"title": "Adapting Desktop Markup",
			"html": "www/categories/adapting-desktop-markup.html",
			"selector": ".c-readme-body"
		},
		{
			"title": "Adding Interactivity",
			"html": "www/categories/adding-interactivity.html",
			"selector": ".c-readme-body"
		}
	]
	...
}
...

```

- `title`: The title of your custom page
- `html`: A path to the custom pages html
- `selector` (Optional): The selector key can be used to select a subset of the html in the specified html file. This can be useful if you are generating your custom pages and only need part of the generated html.

### Custom Content
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

