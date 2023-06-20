#!/usr/bin/env node

// MIT License

// Copyright (c) 2019 Debashish Pal

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

'use strict';

const spawn = require('cross-spawn');
const fs = require('fs-extra');
const tmp = require('tmp');
const read = require('fs').createReadStream;
const unpack = require('tar-pack').unpack;
const chalk = require('chalk');
const { Command } = require('commander');

const dirNameLocalPack = '.local-pack';
const configFile = 'settings.json';
const archiveName = 'tgz';
const logFileName = 'local-package-publisher.log';
let file = `./${dirNameLocalPack}/${configFile}`;
let projectName;
let packageName;
let projectNameInPackageJson;

function isNodeProject() {
    return new Promise((resolve, reject) => {
        fs.readJson('./package.json')
            .then(obj => {
                if (obj.name.indexOf('@') === 0) {
                    let indexOfSlash = obj.name.indexOf('/');
                    let scopeName = obj.name.substr(1, indexOfSlash - 1);
                    let nameExcludingScope = obj.name.substr(indexOfSlash + 1, obj.name.length);
                    projectName = `${scopeName}-${nameExcludingScope}`;
                } else {
                    projectName = obj.name;
                }

                projectNameInPackageJson = obj.name;
                packageName = `${projectName}-${obj.version}.${archiveName}`;
                resolve(packageName);
            })
            .catch(err => {
                console.log(chalk.yellow('Package.json is missing. Please run the command in a valid node project'));
                reject(err)
            })

    });
}

function runPack() {
    return new Promise((resolve, reject) => {
        let command;
        let args;

        command = 'npm';
        args = [
            'pack'
        ]

        const child = spawn(command, args);
        child.on('close', code => {
            if (code !== 0) {
                reject('Failed to pack');
            }
            resolve();
        });
    });
}

function movePackageToTempDir(packagePath, destinationPath) {
    return new Promise((resolve, reject) => {
        fs.move(packagePath, destinationPath, { overwrite: true })
            .then(() => {
                resolve();
            })
            .catch(err => {
                reject(err);
            })

    });

}

function unpackPackage(packageFilePath, unpackDir) {
    return new Promise((resolve, reject) => {
        read(packageFilePath)
            .pipe(unpack(unpackDir, function (err) {
                if (err) reject(err.stack);
                else {
                    fs.remove(packageFilePath)
                        .then(() => {
                            fs.remove(`${unpackDir}/${dirNameLocalPack}`)
                                .then(() => {
                                    resolve();
                                })
                                .catch(err => {
                                    reject(err)
                                })

                        })
                        .catch(err => {
                            reject(err);
                        })
                };
            }))
    });
}

function linkDirGlobal(directory) {
    return new Promise((resolve, reject) => {
        try {
            let command;
            let args;

            command = 'npm';
            args = [
                'link'
            ]

            const currentWorkingDirectory = process.cwd();

            process.chdir(directory);

            const { exec } = require('child_process');

            exec(`${command} ${args}`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }

                if (stderr) {
                    reject(stderr);
                }

                process.chdir(currentWorkingDirectory);
                resolve();
            });
        }
        catch (err) {
            reject(err);
        }

    });
}

function unlinkDirGlobal(packageDetails) {
    return new Promise((resolve, reject) => {
        fs.pathExists(file)
            .then((exists) => {
                if (exists) {
                    let command;
                    let args;

                    command = 'npm';
                    args = [
                        'unlink',
                        packageDetails.packageName
                    ]

                    const currentWorkingDirectory = process.cwd();
                    process.chdir(packageDetails.tempDirectory);
                    spawn.sync(command, args, { stdio: 'inherit' });
                    process.chdir(currentWorkingDirectory);

                    resolve();
                }
                else {
                    resolve();
                }
            })
            .catch(err => {
                reject(err);
            })
    });
}

function readTempDirectory() {
    return new Promise((resolve, reject) => {
        fs.pathExists(file)
            .then((exists) => {
                if (exists) {
                    fs.readJson(file, { throws: false })
                        .then(settings => {
                            if (settings === null) {
                                reject('settings not found');
                            }
                            else if (!settings.TempPath || settings.TempPath === '') {
                                reject('TempPath not found');
                            }
                            else {
                                resolve(settings.TempPath);
                            }
                        })
                        .catch(err => {
                            reject(err);
                        })
                }
                else
                    resolve('');
            })
            .catch(err => {
                reject(err);
            })
    });
}

function getTemporaryDirectory() {
    return new Promise((resolve, reject) => {
        return fs.ensureFile(file)
            .then(() => {
                fs.readJson(file, { throws: false })
                    .then(settings => {
                        if (settings === null) {
                            tmp.dir({ keep: true }, (err, tmpdir) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    fs.writeJson(file, { TempPath: tmpdir })
                                        .then(() => {
                                            console.log(`Added ${chalk.yellow(dirNameLocalPack)} directory. Please add ${dirNameLocalPack} to .gitignore`);
                                            resolve(tmpdir);
                                        })
                                        .catch(err => {
                                            reject(err)
                                        })
                                }
                            });
                        }
                        else {
                            resolve(settings.TempPath);
                        }
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
            .catch(err => {
                reject(err);
            })
    });
}

function deleteTemporaryDirectory(tempDir) {
    return new Promise((resolve, reject) => {
        fs.pathExists(tempDir)
            .then((exists) => {
                if (exists) {
                    fs.remove(tempDir)
                        .then(() => {
                            resolve();
                        })
                        .catch(err => {
                            reject(err);
                        })
                }
                else {
                    resolve();
                }
            })
            .catch(err => {
                reject(err);
            })
    })
}


function deleteLocalPackSettingsDirectory() {
    return new Promise((resolve, reject) => {
        fs.pathExists(dirNameLocalPack)
            .then((exists) => {
                if (exists)
                    fs.remove(dirNameLocalPack)
                        .then(() => {
                            console.log(`Removed ${chalk.yellow(dirNameLocalPack)} directory. You can remove ${dirNameLocalPack} from .gitignore`);
                            resolve();
                        })
                        .catch(err => {
                            reject(err);
                        })
                else
                    resolve();
            })
            .catch(err => {
                reject(err);
            });
    })
}

//Publishes the package to global
function publish() {
    isNodeProject()
        .then(() => {
            return runPack();
        })
        .then(() => {
            return getTemporaryDirectory();
        })
        .then((tempDir) => {
            return new Promise((resolve, reject) => {
                const packageFilePath = `./${packageName}`;
                const destinationPath = `${tempDir}/${packageName}`;
                return movePackageToTempDir(packageFilePath, destinationPath)
                    .then(() => {
                        resolve({ PackageFilePath: destinationPath, PackageDir: tempDir });
                    })
                    .catch(err => {
                        reject(err);
                    });
            })
        })
        .then((unpackDetails) => {
            return new Promise((resolve, reject) => {
                return unpackPackage(unpackDetails.PackageFilePath, unpackDetails.PackageDir)
                    .then(() => {
                        resolve(unpackDetails.PackageDir);
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
        })
        .then((packageDir) => {
            return linkDirGlobal(packageDir);
        })
        .then(() => {
            console.log(chalk.yellow(`${projectNameInPackageJson}`) + chalk.green(` package published successfully to global`));
            console.log('To consume this package, run ' + chalk.yellow(`npm link ${projectNameInPackageJson}`) + ' in target project');
        })
        .catch(err => {
            console.log(err);
            fs.writeFile(`${process.cwd()}/${logFileName}`, err);
            console.log(chalk.red('Failed to publish package to global'));
        });
}

//Removes the package from global
function unpublish() {
    isNodeProject()
        .then((packageName) => {
            return new Promise((resolve, reject) => {
                readTempDirectory()
                    .then(tempDirectory => {
                        resolve({
                            tempDirectory,
                            packageName
                        })
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
        })
        .then((packageDetails) => {
            return new Promise((resolve, reject) => {
                unlinkDirGlobal(packageDetails)
                    .then(() => {
                        resolve(packageDetails.tempDirectory);
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
        })
        .then((tempDir) => {
            return deleteTemporaryDirectory(tempDir);
        })
        .then(() => {
            deleteLocalPackSettingsDirectory();
        })
        .then(() => {
            console.log(chalk.yellow(`${projectNameInPackageJson}`) + chalk.green(` package has been removed from global`));
        })
        .catch(err => {
            console.log(chalk.red('Failed to remove package from global'));
        });
}

//Parse the arguments
const packageJson = require('./package.json');
const { resolve } = require('path');

const program = new Command();

program
    .name('local-package-publisher')
    .description('A tool for publishing a package locally for testing')
    .version(packageJson.version);

program
    .option('-p, --publish', 'publishes the project to global npm directory')
    .option('-u, --unpublish', 'removes the project from global npm directory')

program.parse(process.argv);

const options = program.opts();

if (!options.publish && !options.unpublish) {
    console.log(`${chalk.red('Please provide an option')} ${chalk.yellow('--publish')} ${chalk.red('or')} ${chalk.yellow('--unpublish')}`);
}

if (options.publish && options.unpublish) {
    console.log(`${chalk.red('Either')} ${chalk.yellow('--publish')} ${chalk.red('or')} ${chalk.yellow('--unpublish')} ${chalk.red('option can only be passed at a time')}`);
}

//Run appropriate commands based on the option
if (options.publish)
    publish();

if (options.unpublish)
    unpublish();


