# Translation & Localization Guide

Guide for contributors working on translations and terminology verification in the game data files.

---

## Overview

The project contains 10 JSON files in `src/data/` with game data in up to 3 languages (Chinese, English, French). Translations must match the **official in-game terminology** as closely as possible. When no official translation exists, community-accepted terms are preferred over literal translations.

**Languages supported :**
- `cn` — Chinese (simplified, source language, from the original game client)
- `en` — English (Global client + Fextralife wiki naming conventions)
- `fr` — French (official VF from the game client)

---

## Files overview

| File | Content | Lines | Languages | Priority |
|------|---------|-------|-----------|----------|
| `wwm_glossary.json` | Game terminology, wuxia concepts | 239 | cn, en, fr, pinyin | High |
| `wwm_weapons_martial_arts.json` | 14 martial arts, skills, talents | 2019 | cn, en, fr, pinyin | High |
| `wwm_dps_data_fr.json` | 187 skills, 208 buffs, formulas | 12188 | fr (primary) | Medium |
| `wwm_inner_ways.json` | 37 inner ways with tier/rank data | 1799 | cn, en, fr, pinyin | High |
| `wwm_gear_sets.json` | Equipment sets and bonuses | 998 | en, fr | Medium |
| `wwm_mystic_arts.json` | 40 mystic arts / qishu | 1145 | cn, en, fr, pinyin | High |
| `wwm_sects.json` | Schools / factions | 299 | cn, en, fr, pinyin | Medium |
| `wwm_characters.json` | NPCs and characters | — | en, fr | Low |
| `wwm_items.json` | Items and consumables | — | en, fr | Low |
| `wwm_locations.json` | Map locations | — | en, fr | Low |

---

## What you CAN modify

Translation contributors should **only** touch the following fields:

### Name fields (multilingual objects)

```json
{
  "names": {
    "en": "Nameless Sword",        ← can fix
    "cn": "无名剑法",               ← can fix
    "pinyin": "Wúmíng Jiànfǎ",    ← can fix
    "fr": "Épée Sans Nom"          ← can fix
  }
}
```

### Description fields

```json
{
  "description": {
    "en": "A swift piercing technique",   ← can fix
    "fr": "Une technique de percée rapide" ← can fix
  }
}
```

### Display labels (when they are purely textual)

```json
{
  "nameFR": "Arme Principale",    ← can fix
  "nameEN": "Main Weapon"         ← can fix
}
```

---

## What you must NOT modify

These fields are consumed by the calculation engine. Changing them will break tests.

### IDs and keys

```json
"id": "nameless_sword"           ← NEVER change
"weapon_type": "sword"           ← NEVER change
"category": "offensive"          ← NEVER change
```

### Numeric values (stats, coefficients, formulas)

```json
"base_damage": 923,              ← NEVER change
"multiplier": 1.35,              ← NEVER change
"cooldown": 12,                  ← NEVER change
"tier": 3,                       ← NEVER change
```

### Structural fields (arrays of IDs, references)

```json
"associated_martial_arts": ["strategic_sword", "heavenquaker_spear"]  ← NEVER change
"path": "bellstrike"             ← NEVER change
"variant": "splendor"            ← NEVER change
"slots": [...]                   ← NEVER change structure
```

### Metadata (except version notes)

```json
"metadata": {
  "version": "3.0.0",            ← NEVER change
  "total_count": 37,             ← NEVER change
  "sources": [...]               ← NEVER change
}
```

**Rule of thumb :** if a field contains a number, a code-like string (snake_case, camelCase), or an array of IDs, do not touch it.

---

## JSON format rules

- **Encoding** : UTF-8 (mandatory for Chinese characters)
- **Indentation** : 2 spaces (match existing files)
- **No trailing commas** (JSON standard)
- **Strings** : always double quotes, never single quotes
- **Chinese text** : simplified characters (简体中文), not traditional
- **Pinyin** : with tone marks (e.g. `Wúmíng Jiànfǎ`), not numbers (not `Wuming2 Jianfa3`)
- **French** : proper accents and diacritics (é, è, ê, ç, etc.)

After editing, validate your JSON. You can use:

```bash
# Quick validation (must produce no output = valid)
python3 -m json.tool src/data/wwm_glossary.json > /dev/null
```

---

## How to verify a translation

1. **Check in-game first.** Launch the game in the target language and screenshot the term.
2. **Cross-reference** with community sources:
   - Chinese: [NGA Forums](https://nga.178.com/), [GameKee](https://gamekee.com/)
   - English: [Fextralife Wiki](https://wherewindsmeet.wiki.fextralife.com/), [Boarhat.gg](https://boarhat.gg/)
   - French: official game client (VF)
3. **If no official translation exists**, note it in your PR description and propose a translation with justification.
4. **Pinyin must match standard Hanyu Pinyin** with proper tone marks.

---

## Contribution workflow

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/WWM_Ultimate_calculator.git
cd WWM_Ultimate_calculator
```

### 2. Create a branch

Name your branch with the `trad/` prefix and the file or scope:

```bash
git checkout -b trad/fix-glossary-cn-terms
# or
git checkout -b trad/add-pinyin-mystic-arts
# or
git checkout -b trad/correct-inner-ways-fr
```

### 3. Make your changes

- Edit only the translation fields listed above
- Keep one file per commit when possible
- Do not reformat or reorder the entire JSON file

### 4. Validate

```bash
# Check JSON syntax
python3 -m json.tool src/data/<file>.json > /dev/null

# Check you only modified translation fields (compares against git HEAD)
pnpm validate:translations
# or for a single file:
python3 scripts/validate-translations.py wwm_glossary.json

# Run project tests (translations should not break anything)
pnpm test
```

The validation script compares your changes against the last committed version and reports:
- **OK** — valid translation change (name, description, label)
- **FAIL** — forbidden change (ID, numeric value, structure, metadata)

A PR with any FAIL will not be accepted.

### 5. Commit

Use the `trad:` prefix in your commit messages:

```bash
git commit -m "trad: fix Chinese names for inner ways tier 4-6"
# or
git commit -m "trad: add missing pinyin in mystic_arts.json"
# or
git commit -m "trad: correct French skill names to match in-game VF"
```

### 6. Open a Pull Request

- Target branch: `dev`
- Title: `trad: <short description>`
- In the PR description, include:
  - Which file(s) you changed
  - Which language(s) are affected
  - Source of verification (screenshot, wiki link, NGA thread)
  - Any terms where you were unsure (flag them for review)

---

## Common mistakes to avoid

- Translating IDs or code keys (e.g. changing `"id": "nameless_sword"` to `"id": "epee_sans_nom"`)
- Mixing traditional and simplified Chinese characters
- Using machine translation without verification against in-game text
- Reformatting the entire file (causes massive diffs, impossible to review)
- Changing numeric values while editing nearby text fields
- Adding new fields or restructuring the JSON

---

## Questions?

If you are unsure about a term or a file structure, open an issue with the label `question` or `translation` before making changes.
