import { generateAiCodeSuggestions } from "./aiResponseService.js";
import { checkPythonSyntax } from "./pythonRuntimeService.js";

function buildSuggestion({ type, severity, title, message }) {
  return { type, severity, title, message };
}

function analyzePatterns(code) {
  const suggestions = [];
  const lines = code.split(/\r?\n/);

  if (lines.some((line) => line.length > 88)) {
    suggestions.push(
      buildSuggestion({
        type: "quality",
        severity: "warning",
        title: "Long line detected",
        message: "Consider wrapping lines longer than 88 characters for readability."
      })
    );
  }

  if (/\bprint\(/.test(code)) {
    suggestions.push(
      buildSuggestion({
        type: "quality",
        severity: "info",
        title: "Print-based debugging",
        message: "If this is production-oriented code, consider structured logging instead of raw print statements."
      })
    );
  }

  if (/==\s*True|==\s*False/.test(code)) {
    suggestions.push(
      buildSuggestion({
        type: "quality",
        severity: "warning",
        title: "Boolean comparison can be simplified",
        message: "Prefer direct truthy checks over comparing values to True or False."
      })
    );
  }

  if (/\bTODO\b/i.test(code)) {
    suggestions.push(
      buildSuggestion({
        type: "quality",
        severity: "info",
        title: "Unfinished implementation marker",
        message: "You have a TODO note. Make sure unfinished logic is tracked or completed before shipping."
      })
    );
  }

  const trailingWhitespaceLine = lines.findIndex((line) => /\s+$/.test(line));
  if (trailingWhitespaceLine >= 0) {
    suggestions.push(
      buildSuggestion({
        type: "quality",
        severity: "info",
        title: "Trailing whitespace found",
        message: `Line ${trailingWhitespaceLine + 1} has trailing spaces. Trimming them keeps diffs cleaner.`
      })
    );
  }

  if (/\bexcept\s*:\s*/.test(code)) {
    suggestions.push(
      buildSuggestion({
        type: "quality",
        severity: "warning",
        title: "Broad exception handler",
        message: "Avoid bare except blocks when possible. Catch specific exceptions for safer debugging."
      })
    );
  }

  if (/\bglobal\b/.test(code)) {
    suggestions.push(
      buildSuggestion({
        type: "quality",
        severity: "warning",
        title: "Global state usage",
        message: "Global variables can make code harder to reason about. Consider passing values explicitly."
      })
    );
  }

  if (/\bfor\s+\w+\s+in\s+.*:\s*(?:\r?\n)+\s+for\s+\w+\s+in\s+/s.test(code)) {
    suggestions.push(
      buildSuggestion({
        type: "improvement",
        severity: "warning",
        title: "Nested loop hotspot",
        message: "Nested loops may trend toward quadratic time. Consider hashing, indexing, or pre-grouping data."
      })
    );
  }

  if (/\b(if|elif|while)\b[^\n]*\bin\s+[A-Za-z_][A-Za-z0-9_]*/.test(code)) {
    suggestions.push(
      buildSuggestion({
        type: "improvement",
        severity: "info",
        title: "Membership lookup cost",
        message: "Repeated membership checks on lists can be slow. A set may reduce lookup time and repeated scans."
      })
    );
  }

  if (/append\(.+\)/.test(code) && /\n\s*return\s+\[.*for .* in .*\]/.test(code) === false && /\bfor\b/.test(code)) {
    suggestions.push(
      buildSuggestion({
        type: "improvement",
        severity: "info",
        title: "Intermediate list growth",
        message: "If you only iterate once later, consider generators to reduce extra space from accumulated lists."
      })
    );
  }

  return suggestions;
}

export async function analyzeStaticPythonCode(code) {
  const suggestions = [];
  const syntaxResult = await checkPythonSyntax(code);

  if (!syntaxResult.ok && !syntaxResult.unavailable) {
    suggestions.push(
      buildSuggestion({
        type: "syntax",
        severity: "error",
        title: "Python syntax issue detected",
        message: syntaxResult.error.split("\n").slice(-2).join(" ")
      })
    );
  }

  if (syntaxResult.unavailable) {
    suggestions.push(
      buildSuggestion({
        type: "syntax",
        severity: "info",
        title: "Runtime syntax compiler unavailable",
        message: "Python compilation is unavailable in this environment, so syntax validation is heuristic-only."
      })
    );
  }

  suggestions.push(...analyzePatterns(code));

  if (suggestions.length === 0) {
    suggestions.push(
      buildSuggestion({
        type: "improvement",
        severity: "info",
        title: "No clear complexity gain",
        message: "No obvious time or space complexity improvement stands out in this snippet yet."
      })
    );
  }

  return suggestions.slice(0, 3);
}

function mergeSuggestions(staticSuggestions, aiSuggestions) {
  const syntaxFirst = staticSuggestions.filter((suggestion) => suggestion.type === "syntax");
  const nonSyntaxStatic = staticSuggestions.filter((suggestion) => suggestion.type !== "syntax");
  const merged = [];
  const seen = new Set();

  for (const suggestion of [...syntaxFirst, ...aiSuggestions, ...nonSyntaxStatic]) {
    const key = `${suggestion.type}|${suggestion.title}|${suggestion.message}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(suggestion);
  }

  return merged.slice(0, 3);
}

export async function analyzePythonCode(code, options = {}) {
  const staticSuggestions = await analyzeStaticPythonCode(code);

  if (!options.useAi) {
    return {
      suggestions: staticSuggestions,
      aiUsed: false,
      aiReason: "disabled"
    };
  }

  const aiResult = await generateAiCodeSuggestions({
    code,
    staticSuggestions
  });

  return {
    suggestions: mergeSuggestions(staticSuggestions, aiResult.suggestions),
    aiUsed: aiResult.aiUsed,
    aiReason: aiResult.aiReason
  };
}
