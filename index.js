const spawn = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
var read = require('fs').createReadStream
var unpack = require('tar-pack').unpack
const os = require('os');

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

function linkItGlobal() {
    return new Promise((resolve, reject) => {
        resolve();
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
        return unpackPackage(unpackDetails.PackageFilePath, unpackDetails.PackageDir);
    })
    .then(() => {
        linkItGlobal();
        console.log('package published successfully');
    })
    .catch(err => {
        console.log('Failed to publish a local package')
    })