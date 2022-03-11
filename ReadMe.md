# LBL Linkage Widget V2

## Fixed data _(options for user)_

- SystemType _(Main categories)_
  - systemTemplate _(a preset of configs for a subSystem)_
    - options _(choices for configuration)_
      - options _(options can have options)_

## User Data _(data the user has created from the options above)_

- userProject _(currently can only have one... but in the future will have many)_
  - projectDetails _(the details filled out on the initial form when creating the project)_
  - userSystem _(created from system template, for the user to override with configs)_
    - config _(choices made to override the systemTemplate)_
      - userSelections _(the options the user has chosen for the given config)_
