# readmeio-sync
A tool for making local Readme.io development a breeze!

### 1) Setup:
When readmeio-sync becomes available on npm, this process will be less 'linky'.
```
git clone git@github.com:mobify/readmeio-sync.git
cd readmeio-sync
npm link
cd ../<your_readmeio_project>
npm link readmeio-sync
```

### 2) Credential Setup:
```
export README_EMAIL=<readmeio_account_email>
export README_PASSWORD=<readmeio_account_password>
```

### 3) Project Initialization
This command will download all your existing readmeio content to a folder named after your project.
```
readmeio-sync init <your_project_name>
```

### 4) Workflow
Once your content has been downloaded, you can work with your content offline. Use github and commit changes just like you would with code! Whenever you want to push your changes to Readme.io, simply use.
```
readmeio-sync upload
```

