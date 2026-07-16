# Country Content Style Guide

Audience: a 7–9 year old reading on their own. Every sentence must be fun to
read aloud.

## Reading level
- Present tense, active voice. One idea per sentence.
- Aim for ≤ 14 words per sentence (validator warns beyond ~120 characters per fact).
- No rare words. If a word needs explaining, explain it in the sentence:
  "People race dragon boats — long canoes with dragon heads."
- Numbers stay friendly: "about 17,000 islands", not "17,508 islands".

## Tone
- Wow-facts over dry facts. Animals, records, foods, inventions, sports,
  volcanoes, castles, trains: great. GDP, treaties, regime changes: no.
- Never mention war, atrocities, disasters with victims, poverty shaming, or
  politics. History facts pick wonder ("built pyramids", "sailed huge ships"),
  not conflict.
- Every country gets equal enthusiasm. Small countries get their coolness
  celebrated ("so small you can walk across it before lunch!").

## Field rules
- `name`: the everyday English name a kid would hear (e.g. "South Korea").
- `capital`: the official capital name in common English spelling. For
  countries with multiple capitals, the one used by the validator reference
  (e.g. Bolivia → "Sucre and La Paz" is NOT allowed — use the reference).
- `languages`: 1–3 entries, most spoken first, plain names ("Spanish").
- `dish`: a genuinely popular, kid-recognizable food. `blurb` ≤ 2 short
  sentences describing what it is and why it's yummy. UI labels this
  "A favorite food", so it doesn't have to be an official national dish.
- `funFacts`: exactly 3, each ONE sentence, each a different topic
  (nature / people / records / inventions). No fact repeats the dish,
  capital, or language fields.
- `longAgo.history`: 1–2 sentences about the deep or fun past, wonder-first.
- `longAgo.dino`: a REAL prehistoric creature with fossils found in that
  country or its region. If the country has no famous find, use a
  well-documented regional genus and say "lived in this part of the world".
  Never invent genera. Reuse across neighbors is fine and expected
  (~25 distinct creatures worldwide).
- `famousFor`: a short phrase completing "famous for …", used as a quiz hint.

## Facts safety
- Only widely known, easily verifiable facts. When unsure, pick a safer fact.
- Superlatives need certainty ("the biggest", "the first") — if not sure,
  soften to "one of the biggest".
