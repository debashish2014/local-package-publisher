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
const commander = require('commander');

/**
 * Makes a cross-browser path out of an array of OS-specific paths.
 * EXAMPLE: xosPath(['/foo','bar','qax']) returns cross-browser path
 * for /foo/bar/qax in Posix.
 * @param {array} paths Identical to param1 of path.join()
 * @returns {string} Cross-browser path
 */
function xosPath(paths){
    return path.normalize(path.join(paths));
}

const dirNameLocalPack = '.local-pack';
const configFile = 'settings.json';
const archiveName = 'tgz';
const logFileName = 'local-package-publisher.log';
let file = xosPath([dirNameLocalPack,configFile]);
let projectName;
let packageName;
let projectNameInPackageJson;

function isNodeProject() {
    return new Promise((resolve, reject) => {
        fs.readJson(xosPath(['./package.json']))
            .then(obj => {
                if(obj.name.indexOf('@') === 0){
                    let indexOfSlash = obj.name.indexOf('/');
                    let scopeName = obj.name.substr(1, indexOfSlash - 1);
                    let nameExcludingScope = obj.name.substr(indexOfSlash + 1, obj.name.length);
                    projectName = `${scopeName}-${nameExcludingScope}`;                    
                }else{
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
                            fs.remove(xosPath([unpackDir, dirNameLocalPack]))
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
        let command;
        let args;

        command = 'npm';
        args = [
            'link'
        ]

        process.chdir(directory);
        try {
            spawn.sync(command, args, { stdio: 'inherit' });
            resolve();
        }
        catch (err) {
            reject(err);
        }

    });
}

function unlinkDirGlobal(directory) {
    return new Promise((resolve, reject) => {
        fs.pathExists(file)
            .then((exists) => {
                if (exists) {
                    let command;
                    let args;

                    command = 'npm';
                    args = [
                        'unlink'
                    ]

                    const currentWorkingDirectory = process.cwd();
                    process.chdir(directory);
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
                const packageFilePath = xosPath(['./',packageName]);
                const destinationPath = xosPath([tempDir,packageName]);
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
            linkDirGlobal(packageDir);
        })
        .then(() => {
            console.log(chalk.yellow(`${projectNameInPackageJson}`) + chalk.green(` package published successfully to global`));
            console.log('To consume this package, run ' + chalk.yellow(`npm link ${projectNameInPackageJson}`) + ' in target project');
        })
        .catch(err => {
            fs.writeFile(xosPath([process.cwd(),logFileName]), err);
            console.log(chalk.red('Failed to publish package to global'));
        });
}

//Removes the package from global
function unpublish() {
    isNodeProject()
        .then(() => {
            return readTempDirectory();
        })
        .then((tempDir) => {
            return new Promise((resolve, reject) => {
                unlinkDirGlobal(tempDir)
                    .then(() => {
                        resolve(tempDir);
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
const packageJson = require(path.join(['./package.json']));

const program = new commander.Command(packageJson.name)
    .version(packageJson.version, '-v, --version')
    .usage(`${chalk.yellow('[options]')}`)
    .option('-p, --publish', 'publishes the project to global npm directory')
    .option('-u, --unpublish', 'removes the project from global npm directory')
    .parse(process.argv);

if (!program.publish && !program.unpublish) {
    console.log(`${chalk.red('Please provide an option')} ${chalk.yellow('--publish')} ${chalk.red('or')} ${chalk.yellow('--unpublish')}`);
}

if (program.publish && program.unpublish) {
    console.log(`${chalk.red('Either')} ${chalk.yellow('--publish')} ${chalk.red('or')} ${chalk.yellow('--unpublish')} ${chalk.red('option can only be passed at a time')}`);
}

//Run appropriate commands based on the option
if (program.publish)
    publish();

if (program.unpublish)
    unpublish();


