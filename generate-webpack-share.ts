console.log(`Running webpack generation... ${__dirname}`);

import * as fs from "fs";
import * as path from "path";

import { PackingMethod, SharedNodeModule, packages } from "./generate-webpack-config";

const dependencies = require("../package.json").dependencies;
const libPaths = require("../tsconfig.json").compilerOptions.paths;
const newLineSpaces = "\r\n      ";

function getSharedLibraries(): string[] {
  return Object.entries(libPaths)
    .map(([dependency, value]) => dependency)
    .filter((dependency) => dependency.startsWith("@localshare"))
    .map((name) => `"${name}",`);
}

function getSharedDependencies(): string[] {
  const dependencyNames = Object.entries(dependencies).map(([dependency, version]) => dependency);
  const unknownConfigurations = packages.filter((pkg) => !dependencyNames.find((dep) => pkg.name == dep));
  if (unknownConfigurations.length > 0)
    throw `cannot generate webpack share, found configuration ${unknownConfigurations[0].name} for unknown dependency`;
  return dependencyNames.map((dependency) => {
    let config = getConfiguration(dependency);
    switch (config.packaging) {
      case PackingMethod.Primary:
        return sharedSingleton(dependency, config.looseVersion);
      case PackingMethod.Secondary:
        return getSecondaryShares(dependency, config);
      case PackingMethod.RootJsFiles:
        return getJsRootShares(dependency, config);
      case PackingMethod.Exclude:
        return `// excluded ${dependency}`;
      case PackingMethod.Unknown:
        return `// so far - not defined - please define it :/ ${dependency}`;
    }
    throw `cannot generate webpack share, misconfiguration of ${dependency} dependency`;
  });
}

function getConfiguration(dependency: string): SharedNodeModule {
  let dependencyConfigurations = packages.filter((value) => value.name === dependency);
  if (dependencyConfigurations.length != 1) {
    throw `new package dependency has not been configured in webpack-share.ts --> ${dependency}`;
  }
  let config = dependencyConfigurations[0];
  return config;
}

function sharedSingleton(name: string, looseVersion: boolean | undefined): string {
  if (looseVersion) return `"${name}": {...anyOne},`;
  else return `"${name}": {...theOne},`;
}

function getJsRootShares(dependency: string, config: SharedNodeModule) {
  const folder = getDependencyFolder(dependency);
  const files = fs.readdirSync(folder, { withFileTypes: true });
  const jsExtension = ".js";
  const shares = files
    .filter((entity) => !entity.isDirectory())
    .map((entity) => entity.name)
    .filter((name) => name.endsWith(jsExtension))
    .map((name) => name.substring(0, name.length - jsExtension.length))
    .map((name) => sharedSingleton(`${dependency}/${name}`, config.looseVersion));
  return `// ${dependency} expanded as root js files ${newLineSpaces}${shares.join(newLineSpaces)}`;
}

function getSecondaryShares(dependency: string, config: SharedNodeModule) {
  const folder = getDependencyFolder(dependency);
  const comments = `// ${dependency} expanded as secondary projects, ${
    config.excludePrimary ? "exclude" : "include"
  } primary`;
  const ignoreComments = !!config.excludes ? `, excluding ${config.excludes.join(" ")}` : "";
  const folderItems = fs.readdirSync(folder, { withFileTypes: true });
  const subFolderNames = folderItems
    .filter((entity) => entity.isDirectory() && isIncluded(config, entity) && containsPackageJson(folder, entity))
    .map((entity) => `${dependency}/${entity.name}`);

  let packages = [];
  if (!config.excludePrimary) packages.push(dependency);
  packages.push(...subFolderNames);
  const lines = [comments + ignoreComments, ...packages.map((a) => sharedSingleton(a, config.looseVersion))];
  return lines.join(newLineSpaces);
}

function getDependencyFolder(dependency: string) {
  return `./node_modules/${dependency}`;
}

function isIncluded(config: SharedNodeModule, entity: fs.Dirent) {
  return !isExcluded(config, entity) && checkTestingPackage(entity, config);
}

function checkTestingPackage(entity: fs.Dirent, config: SharedNodeModule) {
  return entity.name != "testing" || (config.includeTesting && entity.name == "testing");
}

function isExcluded(config: SharedNodeModule, entity: fs.Dirent) {
  return !!config.excludes && config.excludes.filter((ex) => ex == entity.name).length != 0;
}

function containsPackageJson(parent: string, entity: fs.Dirent): boolean {
  const folder = path.join(parent, entity.name);
  return fs.readdirSync(folder).filter((name) => name == "package.json").length > 0;
}

const text = `module.exports = {
  // this is generated from generate-webpack-share.ts using package.json - check build processes for how
  getShares: function () {
    const theOne = { singleton: true, strictVersion: true, requiredVersion: "auto" };
    const anyOne = { singleton: true, strictVersion: false, requiredVersion: "auto" };
    return {
      ${getSharedDependencies().join(newLineSpaces)};
    };
  },
  // this is generated from generate-webpack-share.ts using tsconfig.json - check build processes for how
  deltaShares: function () {
    return [
      ${getSharedLibraries().join(newLineSpaces)}
    ];
  },
};
`;
const fileName = "./projects/webpack-share.js";
fs.writeFileSync(fileName, text);
console.log(`Generated ${fileName}`);
