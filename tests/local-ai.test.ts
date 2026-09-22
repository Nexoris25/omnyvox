import { test } from "node:test";
import assert from "node:assert/strict";
import {
  localEndpoint,
  validateDraft,
  aiEnabled,
  localModelReady,
  type AISettings,
} from "../lib/local-ai";
const settings: AISettings = {
  enabled: true,
  model: "qwen3:4b-instruct",
  digest: "a".repeat(64),
  licence: "Apache-2.0 reviewed",
  readinessNotes:
    "CPU, RAM and application latency checked in a controlled deployment.",
  readinessApproved: true,
  monthly: { basic: 5, growth: 20, advanced: 50 },
};
test("AI endpoint refuses external hosts and redirect-like URLs", () => {
  const previous = process.env.OLLAMA_BASE_URL;
  try {
    for (const url of [
      "https://api.openai.com",
      "http://localhost:11434",
      "http://127.0.0.1:11434@evil.test",
      "http://127.0.0.1:11434/path",
    ]) {
      process.env.OLLAMA_BASE_URL = url;
      assert.throws(localEndpoint);
    }
    delete process.env.OLLAMA_BASE_URL;
    assert.equal(localEndpoint(), "http://127.0.0.1:11434");
  } finally {
    if (previous) process.env.OLLAMA_BASE_URL = previous;
    else delete process.env.OLLAMA_BASE_URL;
  }
});
test("AI stays off without explicit environment and operational readiness", () => {
  assert.equal(aiEnabled({ ...settings, readinessApproved: false }), false);
  assert.equal(aiEnabled({ ...settings, digest: "" }), false);
  assert.equal(aiEnabled({ ...settings, enabled: false }), false);
});
test("AI output rejects markup, extra fields and unsupported claims", () => {
  for (const text of [
    "<script>alert(1)</script>",
    "Our award-winning team",
    "We have 50 branches",
    "Visit https://evil.test",
  ]) {
    assert.throws(() =>
      validateDraft(
        { text, missingFacts: [], reviewWarnings: [] },
        "We provide software services in Lagos.",
        "hero.body",
      ),
    );
  }
  assert.throws(() =>
    validateDraft(
      {
        text: "Good services",
        missingFacts: [],
        reviewWarnings: [],
        code: "bad",
      },
      "",
      "hero.body",
    ),
  );
});
test("AI accepts bounded descriptive copy without adding facts", () => {
  const value = {
    text: "Software services in Lagos.",
    missingFacts: [],
    reviewWarnings: ["Review factual accuracy before acceptance."],
  };
  assert.deepEqual(
    validateDraft(value, "Software services in Lagos.", "hero.body"),
    value,
  );
});
test("AI generation requires matching installed model digest", async () => {
  await assert.rejects(
    localModelReady(
      settings,
      (async () =>
        new Response(
          JSON.stringify({
            models: [{ name: settings.model, digest: "b".repeat(64) }],
          }),
        )) as typeof fetch,
    ),
    /digest/,
  );
});
