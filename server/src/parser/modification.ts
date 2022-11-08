import { typeStore, isInputGroup, InputGroup, Element, withScope } from "./parser";
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
 */

import { Expression, getExpression } from "./expression";

interface ModificationBasics {
  instancePath?: string;
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

export function createModificationList(
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

// wrapper function to extract scope
export function createModification(
  props: ModificationProps,
): Modification | undefined {
  const { basePath } = props;

  if (basePath) {
    for (const _ of withScope(basePath)) {
      return _createModification(props);
    }
  } else {
    return _createModification(props);
  }

}

/**
 * Factory method that can create a Modification from two approaches:
 *
 * 1. Either a definition blob of JSON
 * 2. name and value are explicitly provided
 *
 * @param props: ModificationProps
 * @returns Modification
 */
export function _createModification(
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

    element = typeStore.get(
      componentClause1.type_specifier,
      baseType,
    );

    if (!element) {
      element = typeStore.get(componentClause1.type_specifier);
    }

    if (element === undefined) {
      console.log(`${baseType}\t${componentClause1.type_specifier}`);
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
    const redeclareMod = _createModification(childModProps);
    const childMods = redeclareMod ? [redeclareMod] : [];
    // create the redeclare modification
    return new Modification(
      basePath,
      name, // TODO: pass full instance path (or name)
      getExpression(element.type, baseType),
      childMods,
      final,
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

  // attempting to get the targeted template element
  // TODO: just attempt to load the correct element type. This should likely just be
  // baseType + name
  // attempt to load from baseType first, then basePath
  if (name && baseType) {
    element = typeStore.get(name, baseType);
    if (element) {
      scope = element.baseType;
      baseType = element.baseType;
    }
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
        );
 
        value = replaceableType?.modelicaPath || "";
      }
    } else if ("class_modification" in mod) {
      let typePath = baseType;
      let newBasePath = basePath;
      // update base type
      if (name) {
        if (name === 'choices') {
          console.log('a');
        }
        const modElement = typeStore.get(name, baseType); //
        const modType = modElement?.type;
        typePath = modType ? modType : baseType;
        newBasePath = [basePath, name].filter(p => p !== '').join('.');
      }

      mods = getModificationList(mod as mj.ClassMod, newBasePath, typePath); //mod.class_modification
    }
  }

  return new Modification(basePath, name, value, mods, final);
}

export function getModificationList(
  classMod: mj.ClassMod,
  baseType = "",
  name = "",
) {
  return classMod.class_modification
    .map((m) => {
      return _createModification({
        definition: m as mj.WrappedMod,
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
  path: string;
  constructor(
    basePath = "",
    public name="",
    public value: any,
    public mods: Modification[] = [],
    public final = false,
  ) {
    this.path = [basePath, name].filter(s => s !== '').join('.');
  }
}
