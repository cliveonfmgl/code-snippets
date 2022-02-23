export enum PackingMethod {
  // no developer has looked how to share this dependency
  Unknown,

  // print just the primary entrypoint
  // i.e.
  // "@angular/core": {...},
  Primary,

  // print the name, share real secondary entrypoints (with a package.json)
  // i.e.
  // "@angular/common": {...,
  // "@angular/common/http": {...},
  Secondary,

  // print just some random javascript files found in the root folder of the dependency
  // i.e.
  // "@amcharts/amcharts4/charts": {...},
  // "@amcharts/amcharts4/core": {...},
  // "@amcharts/amcharts4/maps": {...},
  RootJsFiles,

  // explicit denial to exclude package from shared dependencies
  Exclude,
}

export interface SharedNodeModule {
  name: string;
  packaging: PackingMethod;
  excludes?: string[];
  excludePrimary?: boolean;
  includeTesting?: boolean;
  looseVersion?: boolean;
}

export const packages: SharedNodeModule[] = [
  { name: "@amcharts/amcharts4", packaging: PackingMethod.RootJsFiles },
  { name: "@angular-architects/module-federation", packaging: PackingMethod.Exclude },
  { name: "@angular-material-components/color-picker", packaging: PackingMethod.Primary },
  { name: "@angular-material-components/datetime-picker", packaging: PackingMethod.Primary },
  { name: "@angular-material-components/moment-adapter", packaging: PackingMethod.Primary },
  { name: "@angular/animations", packaging: PackingMethod.Secondary },
  { name: "@angular/cdk", packaging: PackingMethod.Secondary }, // not really sure what is in the primary...
  {
    name: "@angular/common",
    packaging: PackingMethod.Secondary,
    excludes: ["upgrade", "locales"],
  },
  { name: "@angular/compiler", packaging: PackingMethod.Exclude },
  { name: "@angular/core", packaging: PackingMethod.Primary },
  { name: "@angular/flex-layout", packaging: PackingMethod.Secondary },
  { name: "@angular/forms", packaging: PackingMethod.Primary },
  { name: "@angular/material", packaging: PackingMethod.Secondary, excludePrimary: true },
  { name: "@angular/material-moment-adapter", packaging: PackingMethod.Primary },
  {
    name: "@angular/platform-browser",
    packaging: PackingMethod.Secondary,
  },
  { name: "@angular/platform-browser-dynamic", packaging: PackingMethod.Exclude },
];
