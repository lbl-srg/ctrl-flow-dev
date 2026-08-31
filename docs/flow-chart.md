# ctrl-flow Flow Chart

This document visualizes how [ctrl-flow.lbl.gov](https://ctrl-flow.lbl.gov) works end-to-end: from the Modelica
template source, through the build-time parsing pipeline, into the React
front-end user journey, and finally out as a generated Control Sequence
Document. It complements [linkage-schema.md](./linkage-schema.md) (data
shapes) and [sequence-doc.md](./sequence-doc.md) (annotation syntax) with a
process-oriented view.

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Source["Source of Truth"]
        MOD["Modelica Buildings Library\n(Buildings.Templates.*)"]
    end

    subgraph BuildTime["Build-Time Pipeline (server)"]
        PARSER["server/src/parser\n(loader.ts, parser.ts, template.ts, schedule.ts)"]
        MJSON["dependencies/modelica-json\n(Modelica -> JSON AST)"]
        TPLJSON["templates.json\n(Linkage Schema: templates, options, systemTypes)"]
    end

    subgraph ClientApp["Client (React SPA, hosted on S3)"]
        STORES["MobX Stores\n(UiStore, TemplateStore, ProjectStore, ConfigStore)"]
        INTERP["Interpreter\n(interpreter.ts, display-option.ts)"]
        PAGES["Pages: Landing -> Systems -> Configs -> Schedules -> Results"]
    end

    subgraph ServerAPI["Server API (Express, hosted on ECS Fargate)"]
        EP1["POST /api/modelicatojson"]
        EP2["POST /api/jsontomodelica"]
        EP3["POST /api/sequence"]
        PY["Python: generate_doc.py\n(pandoc + LaTeX + mappings CSV)"]
    end

    MOD --> MJSON --> PARSER --> TPLJSON
    TPLJSON -- "bundled into client build" --> STORES
    STORES <--> INTERP
    INTERP --> PAGES
    PAGES -- "user selections" --> STORES
    PAGES -- "download request" --> EP3
    EP3 --> PY --> EP3
    EP3 -- "generated .docx" --> PAGES
    PAGES -. optional round-trip .-> EP1
    PAGES -. optional round-trip .-> EP2
```

**Key idea:** the Modelica template library is parsed **once at build time**
into a static `templates.json` ("Linkage Schema") that ships with the client.
The browser app then runs entirely client-side against this schema (no
server calls needed to browse templates/options). The server is only called
again when the user wants to **export** a Control Sequence Document.

## 2. Build-Time: Modelica → Linkage Schema (`templates.json`)

```mermaid
flowchart LR
    A["Buildings.Templates package\n(annotated with __ctrlFlow routing)"] --> B["modelica-json\n(parses .mo files into JSON AST)"]
    B --> C["loader.ts\nfinds template entry points\n(__ctrlFlow routing=root/template)\nresolves MODELICAPATH"]
    C --> D["parser.ts\nbuilds Element tree\n(LongClass, Extend, Input, Component)"]
    D --> E["template.ts\nextracts SystemTypes, Templates, Options\n+ modifiers, enable expressions"]
    D --> F["schedule.ts\nbuilds ScheduleOption tables\n(columns/cells for schedule page)"]
    E --> G["scripts/parse-template-package.ts"]
    F --> G
    G --> H["templates.json\n{ templates, systemTypes, options, scheduleOptions, project }"]
    H --> I["Copied into client/src/data/templates.json\n(cdk/README.md build step)"]
```

- Entry point: `npm run parseTemplateJSON` (`server/scripts/parse-template-package.ts`), which calls
  `loadPackage("Buildings.Templates")` then `getTemplates()/getSystemTypes()/getOptions()/getProject()`
  from `server/src/parser/index.ts`.
- In production deploys, this JSON is generated inside the server Docker
  image and `docker cp`'d into `client/src/data/templates.json` before the
  client is built (see `cdk/README.md`).
- This is the "Linkage Schema" — see `docs/linkage-schema.md` for the full
  type definitions (`SystemType`, `Template`, `Option`, `ScheduleOption`).

## 3. Runtime: User Journey Through the App (client/src/App.jsx)

```mermaid
flowchart TD
    START(["User opens ctrl-flow.lbl.gov"]) --> LANDING["/  Landing page\n(components/steps/Landing.tsx)"]
    LANDING --> ONBOARD{"First visit?"}
    ONBOARD -- yes --> MODAL["OnboardingModal"]
    MODAL --> LANDING
    ONBOARD -- no --> CONFIGURE["Click 'Configure Project'\n-> EditDetailsModal\n(project name, address, type...)"]
    CONFIGURE -- "afterSubmit" --> SYSTEMS["/systems\nchoose SystemTypes & Templates\n(Systems/index.tsx, System.tsx)"]
    SYSTEMS -- "add configs" --> CONFIGS["/configs\nconfigure each template instance\n(Configs/index.tsx, Template.tsx,\nOptionSelect.tsx, SlideOut.tsx)"]
    CONFIGS -- "make Selections" --> STOREUPDATE["ConfigStore records Selection[]\n{path, value} keyed by\nmodelicaPath-instancePath"]
    STOREUPDATE --> INTERPRET["Interpreter evaluates\nenable/visible expressions\n& evaluatedValues\n(interpreter.ts, expression-helpers.ts)"]
    INTERPRET --> SCHEDULES["/schedules (optional)\nmechanical & control point schedules\n(Schedules/index.tsx, UserSystemTable.tsx)"]
    SCHEDULES --> RESULTS["/results\nreview summary per template\n(Results/index.tsx)"]
    CONFIGS -.-> RESULTS
    RESULTS --> VALIDATE{"All configs\nfully specified?"}
    VALIDATE -- no --> VALIDATIONMODAL["ValidationModal\n(block navigation)"]
    VALIDATE -- yes --> DOWNLOAD["DownloadModal\n'Download Selected'"]
    DOWNLOAD --> APICALL["POST {API}/sequence\nwith flattened selections"]
    APICALL --> DOCX["Browser downloads\nControl Sequence Document (.docx)"]
    DOCX --> DONE(["End"])
```

Persistent state (via `mobx-persist-store`) lives in four MobX stores created in
`client/src/data/index.ts`:

| Store | Responsibility |
|---|---|
| `UiStore` | transient UI state (e.g. `activeTemplate`, active tab) |
| `TemplateStore` | read-only Linkage Schema data (`templates.json`) — templates, options, systemTypes |
| `ProjectStore` | project metadata (name, address, type, size, units, code, notes) |
| `ConfigStore` | user's `Config`/`Selection[]` per template instance — the write-side data |

All stores are namespaced under `localStorage` key `lbl-storage-v<version>` so
a user's in-progress project persists across page reloads.

## 4. Control Sequence Document Generation (Download Flow)

```mermaid
sequenceDiagram
    participant User
    participant DownloadModal as DownloadModal.tsx
    participant ConfigStore
    participant Express as Express server (/api/sequence)
    participant PyScript as generate_doc.py
    participant Pandoc

    User->>DownloadModal: Click "Download Selected"
    DownloadModal->>ConfigStore: getConfigsForProject()
    DownloadModal->>DownloadModal: getSequenceData()\n(flatten evaluatedValues + selections\n+ systemPath->templatePath per config)
    DownloadModal->>Express: POST {REACT_APP_API}/sequence\nbody = { modelicaPath: [values...], DEL_INFO_BOX: [bool] }
    Express->>PyScript: spawn python3 generate_doc.py -o TMP_PATH.docx\n(selections piped via stdin as JSON)
    PyScript->>PyScript: Resolve [TOGGLE] annotations\nusing mappings CSV (short codes -> modelicaPath)\nagainst source docx (Guideline 36 sequence template)
    PyScript->>Pandoc: Render filtered docx via source-styles.docx + template.tex
    Pandoc-->>PyScript: sequence-TIMESTAMP.docx
    PyScript-->>Express: exit code 0
    Express->>Express: fs.readFile(filePath)
    Express-->>DownloadModal: binary .docx response
    Express->>Express: fs.unlinkSync(filePath) (cleanup)
    DownloadModal-->>User: triggers browser file download
```

Notes:

- The annotation language (`[EQUALS BSP RELIEFDMPR]`, `[AND ...]`, `[TABLE ...]`,
  etc.) that drives which sections of the sequence document survive is
  documented in `docs/sequence-doc.md`.
- The mapping between short codes used in annotations and full
  `modelicaPath`s is stored in a CSV under
  `server/scripts/sequence-doc/src/version/current/`.
- Related but currently **unused in the UI** endpoints exist for a full
  Modelica round-trip:
  - `POST /api/modelicatojson` — parses raw Modelica text into JSON via `dependencies/modelica-json`.
  - `POST /api/jsontomodelica` — converts JSON back into Modelica text.
  These are exercised by server integration tests and are intended for a
  planned future flow where selections are written back into a `.mo` file
  (see "Planned" section of the sequence diagram in `docs/linkage-schema.md`).

## 5. Deployment Topology (AWS, via CDK)

```mermaid
flowchart LR
    subgraph AWS["AWS (cdk/lib/cdk-stack.ts)"]
        S3["S3 Bucket: lbl-client-STAGE\n(static website hosting,\nReact production build)"]
        ALB["Application Load Balancer"]
        FARGATE["ECS Fargate Service\n(server Docker image)"]
    end

    BROWSER["User Browser"] -- "GET /" --> S3
    BROWSER -- "REACT_APP_API calls\n(/api/sequence, etc.)" --> ALB --> FARGATE
    FARGATE -- "runs" --> PARSER2["parser + Python/Pandoc/LaTeX\n(installed in Docker image)"]
```

- `cdk/README.md` documents the manual deploy sequence: CDK provisions the S3
  bucket + Fargate/ALB, the server Docker image is built to extract a fresh
  `templates.json`, then the client is built with `REACT_APP_API` pointing at
  the deployed ALB URL and synced to S3.
- Production and staging both deploy this same topology via GitHub Actions
  (`.github/workflows/prod-deploy.yml`, `staging-deploy.yml`), pointing
  `REACT_APP_API` at `https://ctrl-flow.lbl.gov/api` and
  `https://staging.ctrl-flow.lbl.gov/api` respectively.

## Summary

1. **Offline/Build-time:** Modelica template library → `modelica-json` → LBNL's
   custom parser (`server/src/parser`) → `templates.json` (Linkage Schema).
2. **Client runtime:** React SPA loads the static schema into MobX stores; the
   user walks through Landing → Systems → Configs → (Schedules) → Results,
   with the `interpreter` evaluating conditional visibility/values live in
   the browser — no server round-trip required to browse/configure.
3. **Export:** On download, the client flattens its `Selection`s and POSTs
   them to the Express server's `/api/sequence` endpoint, which shells out to
   a Python script that uses Pandoc/LaTeX plus a mappings CSV to filter the
   ASHRAE Guideline 36 source document down to a project-specific `.docx`
   Control Sequence Document, streamed back to the browser as a download.
4. **Deployment:** Client is a static site on S3; server runs as a Dockerized
   Express app on ECS Fargate behind an ALB — all provisioned via the CDK
   stack in `cdk/lib/cdk-stack.ts`.
