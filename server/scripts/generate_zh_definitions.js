/**
 * Generate simplified Chinese definitions + Vietnamese-Chinese example pairs
 * for Vietnamese headwords using GPT-4o-mini.
 * Reads headwords from /tmp/missing_headwords.txt
 * Outputs JSONL to /tmp/generated_zh_definitions.jsonl (append-safe, skips already done)
 *
 * Usage: node server/scripts/generate_zh_definitions.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || fs.readFileSync(path.join(__dirname, '..', '..', '.env'), 'utf8').match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
const MODEL = 'gpt-4o-mini';
const BATCH_SIZE = 20; // words per API call (smaller = fewer dropped words)
const CONCURRENCY = 30; // parallel requests
const OUTPUT_FILE = '/tmp/generated_zh_definitions.jsonl';
const INPUT_FILE = '/tmp/missing_zh_headwords.txt';
const RATE_LIMIT_DELAY = 200; // ms between batch dispatches

if (!OPENAI_API_KEY) {
    console.error('No OPENAI_API_KEY found in env or .env file');
    process.exit(1);
}

// Load already-generated words to skip
function loadDone() {
    const done = new Set();
    if (fs.existsSync(OUTPUT_FILE)) {
        const lines = fs.readFileSync(OUTPUT_FILE, 'utf8').split('\n').filter(Boolean);
        for (const line of lines) {
            try {
                const obj = JSON.parse(line);
                if (obj.word) done.add(obj.word);
            } catch { }
        }
    }
    return done;
}

const SYSTEM_PROMPT = `你是一个越南语-中文词典生成器。为每个越南语词汇提供简体越中繁體和越中例句。

规则：
- 简洁准确，只用简体中文
- 词性使用标准缩写（n. v. adj. adv. conj. prep. interj. phrase idiom）
- 每个词最多3个最常见的含义
- 每个含义提供一个越南语例句及其中文翻译
- 只输出有效JSON，不要markdown

返回JSON对象，包含"dictionary"数组，每个词一个对象：
{
  "dictionary": [
    {
      "word": "越南语词汇",
      "entries": [
        {
          "pos": "词性",
          "meaning_zh": "简体越中繁體",
          "example_vi": "越南语例句",
          "example_zh": "中文翻译"
        }
      ]
    }
  ]
}`;

async function callOpenAI(words) {
    const userPrompt = `为以下越南语词汇生成中文词典条目：\n${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}\n\n返回JSON对象，包含"dictionary"数组。`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 8192,
            response_format: { type: 'json_object' },
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;

    try {
        const parsed = JSON.parse(content);
        // Handle various wrapper keys GPT-4o-mini might use
        const entries = Array.isArray(parsed) ? parsed
            : parsed.dictionary ? parsed.dictionary
                : parsed.entries ? parsed.entries
                    : parsed.words ? parsed.words
                        : parsed.results ? parsed.results
                            : [parsed];
        return entries;
    } catch (e) {
        console.error('Failed to parse response:', content.slice(0, 200));
        return [];
    }
}

function appendResults(results) {
    const lines = results
        .filter(r => r && r.word && r.entries && r.entries.length > 0)
        .map(r => JSON.stringify(r))
        .join('\n');
    if (lines) {
        fs.appendFileSync(OUTPUT_FILE, lines + '\n');
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const allWords = fs.readFileSync(INPUT_FILE, 'utf8').split('\n').filter(Boolean);
    const done = loadDone();
    const todo = allWords.filter(w => !done.has(w));

    console.log(`Total headwords: ${allWords.length}`);
    console.log(`Already done: ${done.size}`);
    console.log(`Remaining: ${todo.length}`);
    console.log(`Batches: ${Math.ceil(todo.length / BATCH_SIZE)} (${BATCH_SIZE} words/batch, ${CONCURRENCY} concurrent)\n`);

    if (todo.length === 0) {
        console.log('All done!');
        return;
    }

    const batches = [];
    for (let i = 0; i < todo.length; i += BATCH_SIZE) {
        batches.push(todo.slice(i, i + BATCH_SIZE));
    }

    let completed = 0;
    let errors = 0;
    const startTime = Date.now();

    for (let i = 0; i < batches.length; i += CONCURRENCY) {
        const chunk = batches.slice(i, i + CONCURRENCY);

        const promises = chunk.map(async (batch, idx) => {
            const batchNum = i + idx + 1;
            try {
                const results = await callOpenAI(batch);
                appendResults(results);
                completed += batch.length;

                const elapsed = (Date.now() - startTime) / 1000;
                const rate = completed / elapsed;
                const eta = ((todo.length - completed) / rate / 60).toFixed(1);
                process.stdout.write(`\r  Batch ${batchNum}/${batches.length} | ${completed}/${todo.length} words | ${rate.toFixed(1)} w/s | ETA: ${eta}m`);
            } catch (e) {
                errors++;
                console.error(`\n  Batch ${batchNum} failed: ${e.message}`);
                if (e.message.includes('429')) {
                    console.log('  Rate limited, waiting 30s...');
                    await sleep(30000);
                }
            }
        });

        await Promise.all(promises);
        await sleep(RATE_LIMIT_DELAY);
    }

    console.log(`\n\nDone! ${completed} words generated, ${errors} errors.`);
    console.log(`Output: ${OUTPUT_FILE}`);

    const doneNow = loadDone();
    console.log(`Total in output file: ${doneNow.size}`);
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
