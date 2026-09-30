:::bw-guide
{"version":1,"id":"dagger-workshop-example","title":"Dagger workshop: two independent variants","summary":"An original interaction example for editing and comparing complete local guide builds. This is not current meta advice.","tags":["example","daggers","practice"]}
:::

# A small workshop, not a meta ranking

Use this original interaction example to compare two independent snapshots. Both bars leave slot eight open for a deliberate choice. The supported variant assumes outside help; it does not silently add that assumption to the independent variant.

## Read the chain

Start with :bw-skill{skill="catalog:skill:782" context="generic"}, follow with :bw-skill{skill="catalog:skill:780" context="generic"}, then use :bw-skill{skill="catalog:skill:775" context="generic"}. These generic references show catalog ranges. A bound reference below uses only its named variant, even while you edit a different card.

## Independent practice

:::bw-build
{"version":1,"id":"dagger-independent","snapshotVersion":1,"snapshot":{"build":{"schemaVersion":4,"catalogVersion":"pa-e5d0d35ad8f30b4c+skills-9396e01d21481cd1","id":"dagger-independent","name":"Independent practice","mode":"pve","primaryProfessionId":7,"secondaryProfessionId":null,"attributes":[{"attributeId":29,"rank":12},{"attributeId":35,"rank":12}],"skillBar":[782,780,775,1649,1018,2101,2415,null],"titleRankOverrides":[{"key":"title:asura-rank","rank":3},{"key":"title:sunspear-rank","rank":4}],"attributeAdjustments":{"headgearAttributeId":29,"runes":[{"attributeId":29,"runeId":163}],"effectPreferences":[{"effectId":"heroic-refrain","preference":"off","strength":1}]}},"pveBudget":{"level":20,"questBonus":"maximum-applicable"},"rawTemplate":{"source":{"inputKind":"bare","templateKind":"skill","originalInput":"OwBi0xjM5wwwcwEnp/UD+WCAAAAA","originalBareCode":"OwBi0xjM5wwwcwEnp/UD+WCAAAAA","normalizedDependencyInput":null,"templateName":null,"semanticFingerprint":"skill-template:v1:5c84f181df4ae35c","fidelity":"exact-source"},"templateName":null,"primaryProfession":{"namespace":"profession","templateId":7,"catalogId":7,"outcomeKind":"known","label":"Assassin","reason":null},"secondaryProfession":{"namespace":"profession","templateId":0,"catalogId":null,"outcomeKind":"none","label":"None","reason":null},"attributes":[{"namespace":"attribute","templateId":29,"catalogId":29,"outcomeKind":"known","label":"Dagger Mastery","reason":null},{"namespace":"attribute","templateId":35,"catalogId":35,"outcomeKind":"known","label":"Critical Strikes","reason":null}],"skillBar":[{"namespace":"skill","templateId":782,"catalogId":782,"outcomeKind":"known","label":"Jagged Strike","reason":null},{"namespace":"skill","templateId":780,"catalogId":780,"outcomeKind":"known","label":"Fox Fangs","reason":null},{"namespace":"skill","templateId":775,"catalogId":775,"outcomeKind":"known","label":"Death Blossom","reason":null},{"namespace":"skill","templateId":1649,"catalogId":1649,"outcomeKind":"known","label":"Way of the Assassin","reason":null},{"namespace":"skill","templateId":1018,"catalogId":1018,"outcomeKind":"known","label":"Critical Eye","reason":null},{"namespace":"skill","templateId":2101,"catalogId":2101,"outcomeKind":"known","label":"Critical Agility","reason":null},{"namespace":"skill","templateId":2415,"catalogId":2415,"outcomeKind":"known","label":"Asuran Scan","reason":null},{"namespace":"skill","templateId":0,"catalogId":null,"outcomeKind":"empty","label":"Empty","reason":null}]}}}
:::

Independent result: :bw-skill{skill="catalog:skill:775" build="dagger-independent"}. Compare the bound tooltip with the generic reference above. Title preferences are also independent: :bw-skill{skill="catalog:skill:2101" build="dagger-independent"}.

## Supported practice

This comparison assumes an external Heroic Refrain at strength four. Turn it off to inspect the equipment-only preview. The larger rune carries a health tradeoff; a higher preview number alone does not make this a better build.

:::bw-build
{"version":1,"id":"dagger-supported","snapshotVersion":1,"snapshot":{"build":{"schemaVersion":4,"catalogVersion":"pa-e5d0d35ad8f30b4c+skills-9396e01d21481cd1","id":"dagger-supported","name":"Supported practice","mode":"pve","primaryProfessionId":7,"secondaryProfessionId":null,"attributes":[{"attributeId":29,"rank":10},{"attributeId":35,"rank":12}],"skillBar":[782,780,775,1649,1018,2101,2415,null],"titleRankOverrides":[{"key":"title:asura-rank","rank":6},{"key":"title:sunspear-rank","rank":8}],"attributeAdjustments":{"headgearAttributeId":35,"runes":[{"attributeId":29,"runeId":179}],"effectPreferences":[{"effectId":"heroic-refrain","preference":"on","strength":4}]}},"pveBudget":{"level":20,"questBonus":"maximum-applicable"},"rawTemplate":{"source":{"inputKind":"bare","templateKind":"skill","originalInput":"OwBi0pjM5wwwcwEnp/UD+WCAAAAA","originalBareCode":"OwBi0pjM5wwwcwEnp/UD+WCAAAAA","normalizedDependencyInput":null,"templateName":null,"semanticFingerprint":"skill-template:v1:804e29627d551d36","fidelity":"exact-source"},"templateName":null,"primaryProfession":{"namespace":"profession","templateId":7,"catalogId":7,"outcomeKind":"known","label":"Assassin","reason":null},"secondaryProfession":{"namespace":"profession","templateId":0,"catalogId":null,"outcomeKind":"none","label":"None","reason":null},"attributes":[{"namespace":"attribute","templateId":29,"catalogId":29,"outcomeKind":"known","label":"Dagger Mastery","reason":null},{"namespace":"attribute","templateId":35,"catalogId":35,"outcomeKind":"known","label":"Critical Strikes","reason":null}],"skillBar":[{"namespace":"skill","templateId":782,"catalogId":782,"outcomeKind":"known","label":"Jagged Strike","reason":null},{"namespace":"skill","templateId":780,"catalogId":780,"outcomeKind":"known","label":"Fox Fangs","reason":null},{"namespace":"skill","templateId":775,"catalogId":775,"outcomeKind":"known","label":"Death Blossom","reason":null},{"namespace":"skill","templateId":1649,"catalogId":1649,"outcomeKind":"known","label":"Way of the Assassin","reason":null},{"namespace":"skill","templateId":1018,"catalogId":1018,"outcomeKind":"known","label":"Critical Eye","reason":null},{"namespace":"skill","templateId":2101,"catalogId":2101,"outcomeKind":"known","label":"Critical Agility","reason":null},{"namespace":"skill","templateId":2415,"catalogId":2415,"outcomeKind":"known","label":"Asuran Scan","reason":null},{"namespace":"skill","templateId":0,"catalogId":null,"outcomeKind":"empty","label":"Empty","reason":null}]}}}
:::

Supported result: :bw-skill{skill="catalog:skill:775" build="dagger-supported"}. Compare the bound tooltip with the generic reference above. Title preferences are also independent: :bw-skill{skill="catalog:skill:2101" build="dagger-supported"}.

## Try an edit

1. Select a card and change Dagger Mastery, its headgear or its rune.
2. Inspect that card's bound Death Blossom reference, then the other one.
3. Undo once and check that only the latest authored change returns.
4. Drag a skill from the catalog into the open slot, or choose a text caret and insert a generic reference.
5. Save locally, reload, and download Markdown to carry both variants and their assumptions.

## Template input

Use `/build` to insert a blank build, then edit its card. Open **Template and advanced settings**, paste one of these codes into **Card template code**, and choose **Apply card template**. A game code carries purchased ranks and skills; it does not transfer these rune, headgear, title or outside-effect choices.

```text
Independent: OwBi0xjM5wwwcwEnp/UD+WCAAAAA
Supported: OwBi0pjM5wwwcwEnp/UD+WCAAAAA
```

## Usage and recommendations

For a practice run, choose a single target and watch the lead, off-hand and dual-attack sequence before adding more decisions. Leave the optional slot empty until you know what problem you want it to solve. Record the reason for a utility choice beside the bar, so another reader can evaluate your intent.

Treat the supported card as a comparison under an explicit team assumption. If that support is absent, turn the assumption off before comparing tooltips. Use the generic reference when discussing a skill without committing to either build.

## Counters and limits

Blindness, pressure on positioning and interruptions to your attack sequence can make a planned chain unreliable. Observe what actually failed before changing a slot. An assumed-effect preview does not model uptime, enemy movement, team coordination or every combat interaction.

This guide demonstrates the workspace. It makes no claim to a current meta ranking, optimal damage or suitability for every area. Check linked mechanics and adapt deliberately.

## Keep the complete guide

Save the local guide or export Markdown to retain prose, references, exact build identities and bonus assumptions. Copy template is useful for the game; it is intentionally a smaller representation. No external page body, image or rating is embedded in this example.
