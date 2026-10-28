---
{
  "id": "DOC--META-VALIDATION-README",
  "title": "Documentation generation and validation",
  "status": "draft",
  "version": "1.0.0",
  "owner_role": "R17",
  "reviewer_roles": [
    "R03",
    "R13"
  ],
  "scope_ids": [
    "ALL"
  ],
  "source_refs": [
    "S00"
  ],
  "assumption_refs": [
    "A01"
  ],
  "updated": "2026-10-28"
}
---

# Documentation generation and validation

Run from repository root. Python standard library suffices for local structure checks; no application dependencies are required. YAML registries/contracts use JSON syntax (valid YAML1.2), so parsing does not depend on PyYAML.

## Rebuild order

1. `rtk proxy python3 -B docs/_meta/validation/build_root.py`
2. `rtk proxy python3 -B docs/_meta/validation/build_experience.py`
3. `rtk proxy python3 -B docs/_meta/validation/build_features.py`
4. `rtk proxy python3 -B docs/_meta/validation/build_engineering.py`
5. `rtk proxy python3 -B docs/_meta/validation/build_delivery.py`
6. `rtk proxy python3 -B docs/_meta/validation/build_meta.py`
7. `rtk proxy python3 -B docs/_meta/validation/build_contracts.py`
8. `rtk proxy python3 -B docs/_meta/validation/build_reports.py`
9. `rtk proxy python3 -B docs/_meta/validation/build_inventory.py`
10. `rtk proxy python3 -B docs/_meta/validation/validate.py`
11. `rtk proxy python3 -B docs/_meta/validation/validate_simulator_contracts.py`
12. `rtk proxy python3 -B docs/_meta/validation/check_generation.py`

The validator writes the report. Refresh reports/inventory and revalidate after changed outputs so manifest hashes and report schema agree; this is evidence synchronization, not repeated application testing. Schemas must be reviewed when regenerated: inferring a new registry shape is not approval to change it. A changed source with old generated files is caught by a regeneration/hash comparison and traceability checks.

## Checks and limits

Local checks validate required registry types/keys/enums, metadata/source/assumption IDs, every expected topic path,74/24 baseline identity, child/acceptance references, all24 feature sections, permission/flag/budget references, OpenAPI operations, contract refs/examples, AsyncAPI channel links, local Markdown links and manifest content hashes. Negative self-checks confirm malformed enum/required/extra fields fail. The Python standard-library fallback checks a documented keyword subset. When application dependencies are installed, the additional locked Ajv8/ajv-formats batch validates full Draft2020-12 schemas and examples, including expected-invalid financial cases.

The validator automatically uses `jsonschema` and `openapi-spec-validator` when available. The optional Python pins remain [jsonschema4.26.0](https://pypi.org/project/jsonschema/) and [openapi-spec-validator0.9.0](https://pypi.org/project/openapi-spec-validator/). Official PyPI package-host downloads failed during both phases. The implementation phase successfully installed an exact npm alternative: `@apidevtools/swagger-parser13.1.0` for OpenAPI3.1 and `@asyncapi/parser3.6.6` for AsyncAPI3.0. The exact direct and transitive pins are retained in this directory's package.json and package-lock.json. Run `npm --prefix docs/_meta/validation ci --ignore-scripts`, then `node docs/_meta/validation/validate_standards.mjs` (or `--check` for read-only validation). An isolated installation may be selected with `ST_DOC_TOOLS_ROOT`.

The earlier Python-only installation failure was a network availability failure, not an automatic approval rejection. Current [standards evidence](../contract-standards-report.json) records the successful npm alternative, exact runtime, input hashes and parser diagnostics. AsyncAPI emits an informational recommendation to migrate the existing3.0 contract to3.1; no error was reported. The contract version is preserved pending a reviewed compatibility change.

After standards validation changes its report, rebuild inventory and run validate.py. Hash-bound recorded standards results are accepted only for matching contract inputs. These checks establish static schema/contract properties; they do not prove that all target operations exist at runtime or that a typed client matches them. Application, performance, accessibility and provider certification evidence is maintained separately in [implementation evidence](../implementation-evidence.json).
