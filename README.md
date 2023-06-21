# local-package-publisher
A utility app for publishing your npm packages locally for testing.

[![npm Package](https://img.shields.io/npm/v/local-package-publisher.svg)](https://www.npmjs.com/package/local-package-publisher)
[![License](https://img.shields.io/npm/l/local-package-publisher.svg)](https://github.com/debashish2014/local-package-publisher/blob/master/LICENSE)

## Disclaimer
Version 1.0.5 has been tested to work with Windows 11, Mac OSX Ventura 13.4 & Ubuntu 22.10 Kinetic Kudu, with Node version 18 or higher.
If it does not work on other versions, please feel free to raise an issue

## Note: 

This tool simply provides an easy way to publish a package globally on your local machine, so that it can be used in any other node project. It won't help you to build your package, neither it can automatically decide which files you want to include the package. It is upto the developer to decide it. By default, all the files in the project will get included in the package.

#### However, as a general guideline, whichever files you want to ship in the package that you are planning to publish to NPM, make sure you add them using the `files` property in package.json. To know more about it, you can follow this [link](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#files). Also, please set the entry point using `main` or `module` in package.json. Both can also be set depending on whether your package support CJS and ESM respectively.



# About
You have created this awesome npm package and you want to test it locally, before publishing it to [NPM repository](https://www.npmjs.com). What are the options you have? 

Well, below are some of the possible options, but each of them has some caveat, and as a result, it found out the need for this project.

1. **Symbolic Linking** :

    At the root directory of your npm package under test, run the command `npm link`. It would create a symbolic link to the entire folder to the global namespace. So, a folder will be created in the directory where global packages are stored with the name that is the same as that of the value of `name` property in `package.json`.

    To test/consume this package, at the root of the target project, run `npm link [name]`, where `[name]` is the value of the `name` property in `package.json` which is being consumed.

    **Cons**: Every file in the directory gets linked, which can create problems and can interfere with the build process if the linked package is consumed in another project.

2. **Local NPM Repository** :

    You can publish the package under test to a local npm repository hosted using these awesome projects like [CNPM](https://cnpmjs.org/),[Sinopia](https://github.com/rlidwka/sinopia), [Verdaccio](https://verdaccio.org/), [local-npm](https://github.com/local-npm/local-npm) etc. 

    **Cons**: You will need to change the registry that npm is pointing to by running `npm set registry http://localhost:[port]`. 
    
    For most of us this might not be a feasible option due to several reasons, but if it does then it is indeed an option worth considering.

3. **Manual Process** :

    You can first run `npm pack` command at the root directory of the project under test. It will generate a tar file with the name `[package-name]-[version].tgz`.

    Then, unzip the tar file content to a directory, separate from your project.

    Go, to this new directory where the tar contents have been extracted, and run `npm link` from the directory root. Rest of the steps are same as option 1.

    **Cons**: The process is a bit cumbersome and involves a lot of steps.


I have found the third option i.e. **Manual Process** to be the most elegant, even though it requires more steps since it relies on `npm pack` and ensures that the content it packs will be the same as that of when it will be actually published to NPM repository.

### This project is an effort to automate this manual process.

# Installation

Install the package globally

    npm install -g local-package-publisher

# Usage

Say, you have created a project with the name `my-awesome-new-package`

To publish this package, go to the root directory of the project and run the below command:

```
local-package-publisher -p
```
or 

```
local-package-publisher --publish
```
Once you run this command it will give you the below success message.

### `my-awesome-new-package` package published successfully to global

This command will publish the package globally. It will also create a directory .local-pack with a setings.json file in it, in your project. Please do not delete it.

You can safely add the below line to `.gitignore` as well.

```
.local-pack
```

**That's it !!** Now whenever you do any modification in the project and you want to publish the changes, just run the `local-package-publisher -p` command again.

#

Now, to consume this published package, just go to the root directory of the project where you want to consume it and run the below command. It needs to be done only once.

```
npm link my-awesome-new-package
```
**Note**: No need to run the above command again and again.

#

Once, you are done and you want to remove the published package from global, run the below command in the root directory of `my-awesome-new-package` project:

```
local-package-publisher -u
```
or 

```
local-package-publisher --unpublish
```
Once you run this command it will give you the below message.

### `my-awesome-new-package` package has been removed from global

# Credit

`local-package-publisher` wouldn't be possible without using the modules from the following authors:

- [Sindre Sorhus](https://github.com/sindresorhus)
- [Josh Junon](https://github.com/qix-)
- [JP Richardson](https://github.com/jprichardson)
- [TJ Holowaychuk](https://github.com/tj)
- [Moxystudio](https://github.com/moxystudio)
- [Forbes Lindesay](https://github.com/ForbesLindesay-Unmaintained)
- [KARASZI István](https://github.com/raszi)

# License

Licensed under [MIT](http://www.opensource.org/licenses/mit-license.php)

Copyright (c) 2019-2020 [Debashish Pal](https://github.com/debashish2014)