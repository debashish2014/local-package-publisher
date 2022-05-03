# local-package-publisher-xos
This is simply a cross-plaform fork of [![npm Package](https://img.shields.io/npm/v/local-package-publisher.svg)](https://www.npmjs.com/package/local-package-publisher).  It was forked off of `v1.0.4`.

## Differences 

* The main difference is that it uses the Node `path` module to make sure file paths are OS-independent.

* It uses [yarn](https://yarnpkg.com/) instead of [npm](https://www.npmjs.com/), because `npm i` or `npm unlink` undoes all local package linking performed by `npm link`.  However, `yarn` has none of these problems, and comparible commands will not destroy local package links. 

## What follows is the original Readme from that package.

A utility app for publishing your npm packages locally for testing, which works !!

[![npm Package](https://img.shields.io/npm/v/local-package-publisher.svg)](https://www.npmjs.com/package/local-package-publisher)
[![License](https://img.shields.io/npm/l/local-package-publisher.svg)](https://github.com/debashish2014/local-package-publisher/blob/master/LICENSE)

# About
You have created this awesome npm package and you want to test it locally, before publishing to [NPM repository](https://www.npmjs.com). What are the options you have? 

Well, below are some of the possible options, but each of them has some caveat, and as a result, it found out need for this project.

1. **Symbolic Linking** :

    At the root directory of your npm package under test, run the command `npm link`. It would create a symbolic link to the entire folder to the global namespace. So, a folder will be created in the directory where global packages are stored with the name that is same as that of the value of `name` property in `package.json`.

    To test/consume this package, at the root of the target project, run `npm link [name]`, where `[name]` is the value of `name` property in `package.json` which is being consumed.

    **Cons**: Every file in the directory gets linked, which can create problems and can interfere with the build process if the linked package is consumed in another project.

2. **Local NPM Repository** :

    You can publish the package under test to a local npm repository hosted using these awesome projects like [CNPM](https://cnpmjs.org/),[Sinopia](https://github.com/rlidwka/sinopia), [Verdaccio](https://verdaccio.org/), [local-npm](https://github.com/local-npm/local-npm) etc. 

    **Cons**: You will need to change the registry which npm is pointing to by running `npm set registry http://localhost:[port]`. 
    
    For most of us this might not be a feasible option due to several reasons, but if it does then it is indeed an option worth considering.

3. **Manual Process** :

    You can first run `npm pack` command at the root directory of the project under test. It will generate a tar file with the name `[package-name]-[version].tgz`.

    Then, unzip the tar file content to a directory, separate from your project.

    Go, to this new directory where the tar contents have been extracted, and run `npm link` from the directory root. Rest of the steps are same as option 1.

    **Cons**: The process is a bit cumbersome and involves a lot of steps.


I have found out the third option i.e. **Manual Process** to be most elegant, even though it requires more steps since it relies on `npm pack` and it ensures that the content it packs will be same as that of when it will be actually published to NPM repository.

### This project is an effort to automate this manual process.

# Installation

    npm install --save-dev local-package-publisher

To install the package locally to the project

or 

    npm install -g local-package-publisher

To install the package globally

# Usage

Say, you have created a project with the name `my-awesome-new-package`

To publish this package, go to root directory of the project and run below command:

```
local-package-publisher -p
```
or 

```
local-package-publisher --publish
```
Once you run this command it will give you below success message.

### `my-awesome-new-package` package published successfully to global

This command will publish the package globally. It will also create a directory .local-pack with a setings.json file in it, in your project. Please do not delete it.

You can safely add below line to `.gitignore` as well.

```
.local-pack
```

**Thats it !!** Now whenever you do any modification in the project and you want to publish the changes, just run the `local-package-publisher -p` command again.

#

Now, to consume this published package, just go the root directory of the project where you want to consume it, and run below command. It needs to be done only once.

```
npm link my-awesome-new-package
```
**Note**: No need to run above command again and again.

#

Once, you are done and you want to remove the published package from global, run below command in the root directory of `my-awesome-new-package` project:

```
local-package-publisher -u
```
or 

```
local-package-publisher --unpublish
```
Once you run this command it will give you below message.

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