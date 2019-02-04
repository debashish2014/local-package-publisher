# local-package-publisher
A utility app for publishing your npm packages locally for testing, which works !!

# About
You have created this awesome npm package and you want to test it locally, before publishing to [NPM repository](https://www.npmjs.com). What are the options you have? 

Well, below are some of the possible options, but each of them have some caveat, and as a result it found out need of this project.

1. **Symbolic Linking** :

    At the root directory of your npm package under test, run the command `npm link`. It would create a symbolic link to the entire folder to the global namespace. So, a folder will be created in the directory where global packages are stored with the name that is same as that of value of `name` property in `package.json`.

    To test/consume this package, at the root of the target project, run `npm link [name]`, where `[name]` is the value of `name` property in `package.json` which is being consumed.

    **Cons**: Every file in the directory gets linked, which can create problems and can interfere with the build process, if the linked package is consumed in other project.

2. **Local NPM Repository** :

    You can publish the package under test to a local npm repository ex. [Sinopia](https://github.com/rlidwka/sinopia), [Verdaccio](https://verdaccio.org/), [local-npm](https://github.com/local-npm/local-npm). 

    **Cons**: You will need to change the registry which npm is pointing to by running `npm set registry http://localhost:[port]/`.

3. **Manual Process** :

    You can first run `npm pack` command at the root directory of project under test. It will generate a tar file with the name `[package-name]-[version].tgz`.

    Then, unzip the tar file content to a directory, separate from your project.

    Go, to this new directory where the tar contents has been extracted, and run `npm link` from the directory root.

    **Cons**: The process is a bit cumbersome and involves a lot of steps.


I have found out the third option i.e. **Manual Process** to be most elegant, even though it requires more steps, since it relies on `npm pack` and it ensures that the content it packs will be same as that of when it will be actually published to NPM repository.

This project is an effort to automate this manual process.

