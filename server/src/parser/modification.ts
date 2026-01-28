import { typeStore, isInputGroup, LongClass, Element } from "./parser";
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
 * 2. The redeclared type is stored under 'redeclare' property (for both component and class redeclarations)
 * 3. The 'value' only contains the binding expression if there's an assignment (=) for components
 *    (class redeclarations never have a binding value)
 *
 * Examples:
 * - `redeclare NewType myParam` -> redeclare="NewType", value=undefined
 * - `redeclare NewType myParam = someValue` -> redeclare="NewType", value="someValue"
 * - `redeclare package Medium = NewMedium` -> redeclare="NewMedium", value=undefined
 */
function unpackRedeclaration(props: ModificationProps) {
  let { basePath, definition, baseType } = props;
  let redeclaration = (definition as mj.RedeclareMod).element_redeclaration;

  redeclaration =
    "element_replaceable" in redeclaration
      ? redeclaration.element_replaceable
      : (redeclaration as any); // TODO: type this correctly

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
      console.log(
        `Unable to find mod type: ${basePath}\t${componentClause1.type_specifier}`,
      );
      return;
    }
    const redeclareDefinition =
      componentClause1.component_declaration1.declaration;
    const name = redeclareDefinition.identifier;

    // Check if there's a binding (=) in the declaration
    // A binding exists if modification contains an Assignment with 'equal: true'
    let bindingValue: Expression | string | undefined = undefined;
    const childMods: Modification[] = [];

    if (redeclareDefinition.modification) {
      const mod = redeclareDefinition.modification;
      if ("equal" in mod && (mod as mj.Assignment).equal) {
        // There's a binding (=), extract the value
        bindingValue = getExpression(
          (mod as mj.Assignment).expression,
          basePath,
          baseType,
        );
      } else if ("class_modification" in mod) {
        // There are nested modifications but no direct binding
        const nestedMods = getModificationList(
          mod as mj.ClassMod,
          [basePath, name].filter((s) => s).join("."),
          element.type,
        );
        childMods.push(...nestedMods);
      }
    }

    // The redeclared type is stored under 'redeclare' property
    const redeclaredType = element.type;

    // create the redeclare modification
    return new Modification(
      scope,
      name,
      bindingValue, // only set if there's a binding (=)
      childMods,
      final,
      redeclaredType, // the redeclared type path
    );
  } else if ("short_class_definition" in redeclaration) {
    // Short class definition redeclaration: `redeclare package Medium = NewMedium`
    // The aliased type (NewMedium) is stored under 'redeclare' property
    // 'value' is undefined (no binding for class redeclarations)
    const shortClassDef = redeclaration.short_class_definition as mj.ShortClassDefinition;
    const specifier = shortClassDef.short_class_specifier;
    const name = specifier.identifier;

    // Get the aliased type from the RHS - this goes in 'redeclare'
    const aliasedTypeName = specifier.value?.name;
    const aliasedType = aliasedTypeName
      ? typeStore.get(aliasedTypeName, basePath)
      : undefined;
    const redeclaredType = aliasedType?.modelicaPath || aliasedTypeName || "";

    // Get any nested modifications from class_modification
    let childMods: Modification[] = [];
    if (specifier.value?.class_modification) {
      childMods = getModificationList(
        { class_modification: specifier.value.class_modification } as mj.ClassMod,
        [basePath, name].filter((s) => s).join("."),
        redeclaredType,
      );
    }

    return new Modification(
      basePath,
      name,
      undefined, // no binding for class redeclarations
      childMods,
      final,
      redeclaredType, // the aliased type goes in redeclare
    );
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
          .element_replaceable ??
          choiceMod.element_redeclaration) as mj.ElementReplaceable;
        const clause =
          "component_clause1" in (replaceable as mj.ElementReplaceable)
            ? replaceable.component_clause1
            : replaceable.short_class_definition;
        const typeSpecifier =
          "component_clause1" in replaceable
            ? (clause as mj.ComponentClause1).type_specifier
            : (clause as mj.ShortClassDefinition).short_class_specifier.value
                ?.name;
        const constrainingClause = replaceable.constraining_clause;
        const replaceableType = typeStore.get(typeSpecifier, basePath);
        value = replaceableType?.modelicaPath || ""; // modelicaPath is the replaceable type
        // get selection mods
        const classModification = (
          "component_clause1" in replaceable
            ? (clause as mj.ComponentClause1).component_declaration1.declaration
                ?.modification
            : (clause as mj.ShortClassDefinition).short_class_specifier.value
                ?.class_modification
        ) as mj.ClassMod;
        // Additional modifiers can be attached to choice
        if (classModification) {
          // Include component name in path for nested modifications
          const nestedBasePath = [basePath, name].filter((s) => s).join(".");
          mods = getModificationList(classModification, nestedBasePath, value);
          // TODO: getModificationList should handle redeclares but it is not
          // correctly unpacking nested modifiers - this is a bug
          // kludge: remove nested modifiers
          // See https://github.com/lbl-srg/ctrl-flow-dev/issues/416
          mods.forEach((m) => (m.mods = []));
        }
      }
    } else if ("class_modification" in mod) {
      let typePath = baseType;
      // update base type
      if (name) {
        const modElement = typeStore.get(name, baseType); //
        const modType = modElement?.type;
        typePath = modType ? modType : baseType;
      }
      // Include component name in path for nested modifications
      const nestedBasePath = [basePath, name].filter((s) => s).join(".");
      mods = getModificationList(mod as mj.ClassMod, nestedBasePath, typePath);
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
 *
 * For redeclare modifications:
 * - 'redeclare' stores the redeclared type (string), e.g., "Package.NewType", or "" if not a redeclare
 * - 'value' stores the binding expression only if there's an assignment (=), otherwise undefined
 *   Example: `redeclare NewRecordType record = localRecordInstance`
 *            -> redeclare = "NewRecordType", value = "localRecordInstance"
 *   Example: `redeclare NewType myParam`
 *            -> redeclare = "NewType", value = undefined
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
    public redeclare: string = "", // "" if not a redeclare, otherwise the redeclared type path
  ) {
    this.modelicaPath = [basePath, name].filter((s) => s !== "").join(".");
    if (this.modelicaPath) {
      // only register the mod if it has a path
      modStore.set(this.modelicaPath, this);
    }
  }
}
