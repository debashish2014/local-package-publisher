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


const spawn = require('cross-spawn');
const fs = require('fs-extra');
const tmp = require('tmp');
var read = require('fs').createReadStream;
var unpack = require('tar-pack').unpack;
const chalk = require('chalk');

const dirName = '.local-pack';
const configFile = 'settings.json';
let file = `./${dirName}/${configFile}`;
let packageName;

function isNodeProject() {
    return new Promise((resolve, reject) => {
        fs.readJson('./package.json')
            .then(obj => {
                packageName = `${obj.name}-${obj.version}.tgz`;
                resolve(packageName);
            })
            .catch(err => {
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
                            fs.remove(`${unpackDir}/.local-pack`)
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
        const child = spawn(command, args, { stdio: 'inherit' });
        child.on('close', code => {
            if (code !== 0) {
                reject('Failed to link the package');
            }
            resolve();
        });
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
        linkDirGlobal(packageDir);
    })
    .then(() => {
        console.log(chalk.green('Package published successfully'));
    })
    .catch(err => {
        console.log(chalk.read('Failed to publish a local package'));
    })