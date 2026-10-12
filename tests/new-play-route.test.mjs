import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalDatabase } from "../local-test/database.mjs";
import { loadCatalog } from "../local-test/catalog.mjs";
import { playMe, playCommand } from "../local-test/play.mjs";
import {
  puzzleStart,
  puzzleAction,
  sequenceStart,
  sequenceAction,
} from "../src/lib/collection-extra-play.mjs";
import { isPlayProjection } from "../src/lib/play-contract.mjs";
const d = new LocalDatabase(
  join(mkdtempSync(join(tmpdir(), "keepy-new-route-")), "qa.sqlite"),
  await loadCatalog(),
);
try {
  const a = d.session("member-a"),
    b = d.session("member-b"),
    cat = d.collectionCatalogue(),
    cards = cat.cards.slice(0, 4);
  for (const c of cards)
    d.db.prepare("INSERT INTO holdings VALUES(?,?,?)").run("member-a", c.cardId, 1);
  const send = (action, data, key) =>
    playCommand(d, a, { action, data, expectedVersion: playMe(d, a).settings.version }, key);
  send(
    "journey",
    { modes: ["puzzle", "sequence"], paused: false, restart: true },
    "qa-route-start",
  );
  assert.equal(playMe(d, a).settings.data.journey.ruleVersion, "local-theme-journey-v2");
  assert.equal(playMe(d, b).settings.data.journey, undefined);
  const proof = (mode, seed) => {
    let s =
      mode === "puzzle"
        ? puzzleStart(
            cards.map((c) => c.cardId),
            "easy",
            seed,
          )
        : sequenceStart(
            cards.map((c) => c.cardId),
            "easy",
            seed,
          );
    if (mode === "puzzle") {
      for (let i = 0; i < s.tiles.length; i++) {
        const from = s.tiles.indexOf(i);
        if (from !== i) s = puzzleAction(s, { type: "swap", from, to: i });
      }
    } else
      while (!s.complete) {
        s = sequenceAction(s, { type: "conceal" });
        const stage = s.stage;
        for (const id of s.sequence.slice(0, stage)) s = sequenceAction(s, { type: "answer", id });
      }
    return {
      mode,
      difficulty: "easy",
      seed,
      ruleVersion: s.ruleVersion,
      visibilityKey: cat.visibilityKey,
      cardIds: cards.map((c) => c.cardId),
      cardVersions: cards.map((c) => c.cardVersion),
      events: s.events,
    };
  };
  send("result", proof("sequence", 10), "qa-route-out-order");
  assert.equal(playMe(d, a).settings.data.journey.completed, 0);
  const p = proof("puzzle", 11);
  send("result", p, "qa-route-puzzle");
  send("result", p, "qa-route-duplicate");
  assert.equal(playMe(d, a).settings.data.journey.completed, 1);
  send(
    "journey",
    { modes: ["puzzle", "sequence"], paused: true, restart: false },
    "qa-route-pause",
  );
  send("result", proof("sequence", 12), "qa-route-paused-result");
  assert.equal(playMe(d, a).settings.data.journey.completed, 1);
  send(
    "journey",
    { modes: ["puzzle", "sequence"], paused: false, restart: false },
    "qa-route-resume",
  );
  send("result", proof("sequence", 13), "qa-route-sequence");
  assert.equal(playMe(d, a).settings.data.journey.completed, 2);
  assert.equal(isPlayProjection(playMe(d, a)), true);
  d.db.prepare("DELETE FROM holdings WHERE user_id=?").run("member-a");
  assert.equal(playMe(d, a).settings.data.journey.invalidated, true);
  assert.equal(playMe(d, a).settings.data.journey.completed, 0);
  console.log(
    "New-mode journey rule version, exact prerequisite, duplicate, pause/resume, owner isolation and invalidated source concealment PASS",
  );
} finally {
  d.close();
}
