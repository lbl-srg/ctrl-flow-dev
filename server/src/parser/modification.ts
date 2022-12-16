import { typeStore, isInputGroup, InputGroup, Element } from "./parser";
import * as mj from "./mj-types";

/**
 * Modifications are places where there is an assignment, e.g.
 * 'my_param=5'. Modifications can also contain groups of modifications, e.g.
 * ```
 * MyClass myClassInstance(
 *  myclassParam=true,
 *  anotherMyClassParam=5
 * )
 * ```
 * The above becomes three modifiers, one for 'myClassInstance', and two for
 * the key/value assigned parameters
 *
 * Modifications are used in all places where there are assignments, so this includes
 * annotations that contain purely UI related data, or with the 'graphic' tag that
 * contains SVG data.
 *
 * Parameter modifications are kept in a store using a modelica path. All other
 * modifications (annotation, graphic) are not put in the store.
 *
 * TODO: remove the modification store it is not used
 */

import { evaluateExpression, Expression, getExpression } from "./expression";

const modStore: Map<string, Modification> = new Map();

interface ModificationBasics {
  basePath?: string;
  baseType?: string;
  name?: string;
  value?: any;
  definition?: any;
  type?: string;
  final?: boolean;
}

interface ModificationWithDefinition extends ModificationBasics {
  definition: mj.WrappedMod | mj.Mod | mj.DeclarationBlock | mj.RedeclareMod;
  value?: never;
  extends_clause?: any;
  constraining_clause?: any;
}

interface ModificationWithValue extends ModificationBasics {
  definition?: never;
  value: any;
  name: string;
}

type ModificationProps = ModificationWithDefinition | ModificationWithValue;

/**
 * Factory method that can create a Modification from two approaches:
 *
 * 1. Either a definition blob of JSON
 * 2. name and value are explicitly provided
 *
 * @param props: ModificationProps
 * @returns Modification
 */
export function createModification(
  props: ModificationProps,
): Modification | undefined {
  const mods: Modification[] = [];
  const { definition, value, basePath = "", name } = props;

  if (definition) {
    if ("element_redeclaration" in definition) {
      return unpackRedeclaration(props);
    }

    return unpackModblock(props);
  }

  return new Modification(basePath, name, value, mods);
}

/**
 * Redeclaration Mods need to be unpacked slightly differently:
 *
 * 1. The JSON structure needs to be unpacked to get to the mod definition
 * 2. The modification type needs to updated to the redeclared type
 *
 */
function unpackRedeclaration(props: ModificationProps) {
  let { basePath, definition, baseType } = props;
  const redeclaration = (definition as mj.RedeclareMod).element_redeclaration;
  const final = "final" in redeclaration ? redeclaration.final : false;
  if ("component_clause1" in redeclaration) {
    const componentClause1 =
      redeclaration.component_clause1 as mj.ComponentClause1;

    // TODO: remove this caste once 'typeStore.get' throws
    let element: Element | undefined;
    let scope = baseType;

    element = typeStore.get(
      componentClause1.type_specifier, // always relative to basePath
      baseType,
    );

    if (!element) {
      element = typeStore.get(componentClause1.type_specifier, basePath);
      scope = basePath;
    }

    if (element === undefined) {
      console.log(`${basePath}\t${componentClause1.type_specifier}`);
      return;
    }
    const redeclareDefinition =
      componentClause1.component_declaration1.declaration;
    const name = redeclareDefinition.identifier;
    const childModProps = {
      ...props,
      element: element.type,
      definition: redeclareDefinition,
      baseType: element.type,
      final,
    };
    // create child modifications
    const redeclareMod = createModification(childModProps);
    const childMods = redeclareMod ? [redeclareMod] : [];
    // create the redeclare modification
    return new Modification(
      scope,
      name,
      getExpression(element.type, basePath, baseType),
      childMods,
      final,
      true,
    );
  } else if ("short_class_definition" in redeclaration) {
  } else if ("element_replaceable" in redeclaration) {
  }
}

/**
 * Unpacks a modification definition, recursively extracting
 * a mod and its child options
 */
function unpackModblock(props: ModificationProps) {
  let mods: Modification[] = [];
  let value: Expression | string = ""; // value can be 'type'
  let {
    definition,
    basePath = "",
    baseType,
    name,
    final,
  } = props as ModificationWithDefinition;

  let modBlock = definition;
  // let final = false; // TODO: may need to be a nullable bool

  if ("element_modification_or_replaceable" in definition) {
    modBlock =
      definition.element_modification_or_replaceable.element_modification;

    if ("final" in definition.element_modification_or_replaceable) {
      final = definition.element_modification_or_replaceable.final;
    }
  }

  modBlock =
    "element_modification_or_replaceable" in definition
      ? definition.element_modification_or_replaceable.element_modification
      : definition;

  // grab identifier
  if ("name" in modBlock) {
    name = modBlock.name;
  } else if ("identifier" in modBlock) {
    name = modBlock.identifier;
  }

  let element: Element | undefined;
  let scope = baseType;

  // attempt to load from baseType first, then basePath
  if (name && basePath && baseType) {
    element = typeStore.get(name, baseType);
    if (!element) {
      element = typeStore.get(name, basePath);
      scope = basePath;
    } else {
      scope = element.baseType;
      baseType = element.baseType;
    }
  } else if (name && basePath) {
    element = typeStore.get(name, basePath);
    scope = basePath;
  } else if (name && baseType) {
    element = typeStore.get(name, baseType);
    baseType = element?.baseType;
    scope = baseType;
  }

  let mod:
    | mj.WrappedMod
    | mj.RedeclareMod
    | mj.ClassMod
    | mj.Assignment
    | null = null;
  // grab and parse mod
  if ("modification" in modBlock) {
    mod = (modBlock as mj.Mod).modification;
  }

  if (mod) {
    if ("equal" in mod) {
      value = getExpression(
        (mod as mj.Assignment).expression,
        basePath,
        baseType,
      );
    } else if (name == "choice") {
      const choiceMod = (mod as mj.ClassMod)
        .class_modification[0] as mj.RedeclareMod;
      if (choiceMod.element_redeclaration) {
        const replaceable = (choiceMod.element_redeclaration
          .element_replaceable ||
          choiceMod.element_redeclaration) as mj.ElementReplaceable;
        const replaceableType = typeStore.get(
          replaceable.component_clause1.type_specifier,
          basePath,
        );

        value = replaceableType?.modelicaPath || "";
      }
    } else if ("class_modification" in mod) {
      let typePath = baseType;
      // update base type
      if (name) {
        const modElement = typeStore.get(name, baseType); //
        const modType = modElement?.type;
        typePath = modType ? modType : baseType;
      }
      mods = getModificationList(mod as mj.ClassMod, basePath, typePath); //mod.class_modification
    }
  }

  return new Modification(scope, name, value, mods, final);
}

export function getModificationList(
  classMod: mj.ClassMod,
  basePath: string,
  baseType = "",
  name = "",
) {
  return classMod.class_modification
    .map((m) => {
      return createModification({
        definition: m as mj.WrappedMod,
        basePath: basePath,
        baseType: baseType,
        name,
      });
    })
    .filter((m) => m !== undefined) as Modification[];
}

/**
 * Some Modifications need to be referenced, some don't. A modification is a key - value assignmnent,
 * It can either be a singular modification (e.g. a=1) or it can be a modification with nested modifications
 *  (e.g. a redeclare statement)
 *
 * The mod 'name' can be explicitly provided instead of discovered
 */
export class Modification {
  empty = false;
  modelicaPath = "";
  constructor(
    basePath = "",
    public name = "",
    public value: any,
    public mods: Modification[] = [],
    public final = false,
    public redeclare = false,
  ) {
    this.modelicaPath = [basePath, name].filter((s) => s !== "").join(".");
    if (this.modelicaPath) {
      // only register the mod if it has a path
      modStore.set(this.modelicaPath, this);
    }
  }
}
