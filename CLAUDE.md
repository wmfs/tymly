# Tymly Project Context

## Project Overview
Tymly is a backend workflow system for data collection and manipulation. It works by pooling together blueprints, plugins, packages and other directories to build project workflows for end users.

## Monorepo Structure
- Each sub-directory (e.g. each blueprint) is its **own git repo** with independent branches
- Key top-level directories: `blueprints/`, `plugins/`, `packages/`

## Branching Workflow
- Feature branches off `master` for major pieces of work
- Story branches off feature branches for individual tasks
- Branch naming convention: `username/sc-XXXXX/description` (Shortcut ticket IDs)

## Blueprint Structure

Blueprints are modular components that Tymly assembles on boot.

### Subdirectories

- **card-templates** - Form definitions using "cardscript" (extended Microsoft Adaptive Cards spec). Define the questions/fields users interact with.
- **functions** - JavaScript functions callable from within state machines.
- **message-templates** - Email/SMS templates using GOV.UK Notify, triggered from state machines.
- **models** - Schema definitions that auto-generate/migrate Postgres tables on boot. Fields often map 1:1 to card-template fields. Supports additive changes (new fields added on reboot).
- **pg-scripts** - Postgres SQL scripts executed on boot.
- **property-viewer-actions / collapsibles / states** - Components of property cards (cards that exist for every property in `wmfs.gazetteer`). Decoupled across blueprints so they're assembled at boot from whatever blueprints are deployed - no forced dependencies.
  - **actions** - things you can do from a property card (e.g. "resume audit")
  - **collapsibles** - expandable info sections
  - **states** - status indicators
- **search-docs** - Map model entries into Solr for searching.
- **sequences** - Named Postgres sequences for record identification.
- **shared** - Miscellaneous files accessed by functions or other subdirectories.
- **state-machines** - Core workflow/process definitions. Based on Amazon States Language (modified). Typical flow:
  1. Pre-processing - gather data from models, set up execution context
  2. Awaiting human input - direct user to a card-template
  3. Post-processing - upsert data, send notifications, trigger forward events
- **template-roles** - RBAC role definitions for on-premises access control.
- **views** - Postgres view definitions, created on boot like models.

### Key Config
- **blueprint.json** - Blueprint metadata/config at the root.
- **index.js** - Entry point.

### Boot Behaviour
Tymly picks up all blueprint components on boot and assembles them. This includes creating/migrating Postgres tables from models, executing pg-scripts, registering state machines, composing property viewer components, etc.
