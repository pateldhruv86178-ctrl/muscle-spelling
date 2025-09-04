<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Muscle Spelling</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    function App() {
      const DEFAULT = [
        { word: "accommodate", hint: "to provide room for" },
        { word: "rhythm", hint: "a strong, regular repeated pattern" },
        { word: "maintenance", hint: "act of maintaining" },
        { word: "conscience", hint: "moral sense" },
        { word: "definitely", hint: "without doubt" },
      ];

      const [words, setWords] = useState(() => {
        try {
          const raw = localStorage.getItem("ms_words");
          return raw ? JSON.parse(raw) : DEFAULT;
        } catch (e) {
          return DEFAULT;
        }
      });

      const [indexOrder, setIndexOrder] = useState(() => {
        try {
          const raw = localStorage.getItem("ms_order");
          return raw ? JSON.parse(raw) : [...Array(words.length).keys()];
        } catch (e) {
          return [...Array(words.length).keys()];
        }
      });

      useEffect(() => {
        localStorage.setItem("ms_words", JSON.stringify(words));
        setIndexOrder((prev) => {
          if (prev.length !== words.length) return [...Array(words.length).keys()];
          return prev;
        });
      }, [words]);

      useEffect(() => {
        localStorage.setItem("ms_order", JSON.stringify(indexOrder));
      }, [indexOrder]);

      const [progress, setProgress] = useState(() => {
        try {
          const raw = localStorage.getItem("ms_progress");
          return raw ? JSON.parse(raw) : {};
        } catch (e) {
          return {};
        }
      });
      useEffect(() => {
        localStorage.setItem("ms_progress", JSON.stringify(progress));
      }, [progress]);

      const [pos, setPos] = useState(0);
      const currentIndex = indexOrder[pos % Math.max(1, indexOrder.length)];
      const current = words[currentIndex] || { word: "", hint: "" };

      const [input, setInput] = useState("");
      const [message, setMessage] = useState("");
      const [showAnswer, setShowAnswer] = useState(false);
      const [shuffleOn, setShuffleOn] = useState(true);

      const inputRef = useRef(null);
      useEffect(() => {
        inputRef.current?.focus();
      }, [pos, currentIndex]);

      function normalize(s) {
        return s.trim().toLowerCase();
      }

      function handleSubmit(e) {
        e?.preventDefault();
        const correct = normalize(input) === normalize(current.word);
        if (correct) {
          setMessage("Correct!");
          setProgress((p) => ({ ...p, [current.word]: (p[current.word] || 0) + 1 }));
          nextCard(true);
        } else {
          setMessage("Not quite — try again or press Reveal");
          setProgress((p) => ({ ...p, [current.word]: Math.max(0, (p[current.word] || 0) - 1) }));
        }
      }

      function nextCard() {
        setInput("");
        setShowAnswer(false);
        setMessage("");
        setPos((p) => (p + 1) % Math.max(1, indexOrder.length));
      }

      function reveal() {
        setShowAnswer(true);
        setMessage(`Answer: ${current.word}`);
      }

      function toggleShuffle() {
        setShuffleOn((s) => !s);
      }

      function handleImportText(txt) {
        const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const parsed = lines.map((l) => {
          const parts = l.split(/\t|\s{2,}/);
          return { word: parts[0], hint: parts[1] || "" };
        });
        if (parsed.length) setWords(parsed);
      }

      function handleExport() {
        const txt = words.map((w) => (w.hint ? `${w.word}\t${w.hint}` : w.word)).join("\n");
        const blob = new Blob([txt], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "muscle_spelling_words.txt";
        a.click();
        URL.revokeObjectURL(url);
      }

      function addWord(word, hint = "") {
        if (!word?.trim()) return;
        setWords((w) => [...w, { word: word.trim(), hint: hint.trim() }]);
      }

      function removeWord(i) {
        setWords((w) => w.filter((_, idx) => idx !== i));
      }

      function resetProgress() {
        setProgress({});
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 p-6">
          <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6">
            <header className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Muscle Spelling — Practice Tool</h1>
              <div className="text-sm text-slate-600">Keyboard-first · Local-only</div>
            </header>

            <main className="grid md:grid-cols-3 gap-6">
              <section className="md:col-span-2 p-4 rounded-lg border">
                <div className="mb-4">
                  <div className="text-sm text-slate-500">Hint</div>
                  <div className="text-lg font-medium">{current.hint || "(no hint)"}</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <label className="block text-sm text-slate-600">Type the word:</label>
                  <input
                    ref={inputRef}
                    className="w-full p-3 border rounded-lg text-xl font-mono"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type here and press Enter"
                    autoComplete="off"
                  />

                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 rounded-lg border shadow-sm">Check</button>
                    <button type="button" onClick={reveal} className="px-4 py-2 rounded-lg border">Reveal</button>
                    <button type="button" onClick={() => nextCard()} className="px-4 py-2 rounded-lg border">Skip →</button>
                    <div className="ml-auto text-sm text-slate-500">Progress: {progress[current.word] || 0}</div>
                  </div>
                </form>

                <div className="mt-4 text-sm text-rose-600">{message}</div>
                {showAnswer && (
                  <div className="mt-4 p-3 bg-slate-100 rounded">Answer: <strong>{current.word}</strong></div>
                )}

                <div className="mt-6 flex gap-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={shuffleOn} onChange={toggleShuffle} /> Shuffle</label>
                  <button onClick={() => { setPos(0); setIndexOrder([...Array(words.length).keys()]); }} className="border rounded px-3">Restart Order</button>
                  <button onClick={resetProgress} className="border rounded px-3">Reset Scores</button>
                </div>
              </section>

              <aside className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Word list</h3>
                <div className="text-sm mb-3">{words.length} words · export / import</div>
                <div className="space-y-2">
                  <div className="max-h-40 overflow-auto text-sm border rounded p-2 bg-white">
                    {words.map((w, i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <div className="truncate">{w.word} {w.hint && <span className="text-slate-400">— {w.hint}</span>}</div>
                        <div className="flex gap-2 items-center">
                          <div className="text-xs text-slate-500">{progress[w.word] || 0}</div>
                          <button onClick={() => { setPos(i); }} className="text-xs px-2 py-1 border rounded">Go</button>
                          <button onClick={() => removeWord(i)} className="text-xs px-2 py-1 border rounded">Del</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={handleExport} className="flex-1 border rounded px-3 py-2">Export</button>
                    <label className="flex-1 border rounded px-3 py-2 cursor-pointer text-center">
                      <input
                        type="file"
                        accept=".txt"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const text = await f.text();
                          handleImportText(text);
                        }}
                      />
                      Import file
                    </label>
                  </div>

                  <div className="mt-3">
                    <AddWordForm onAdd={addWord} />
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Shortcuts: Enter to check (or submit), Space to reveal, ← / → to navigate.
                  </div>
                </div>

              </aside>
            </main>

            <footer className="mt-6 text-sm text-slate-500">Made with ❤️ — editable word lists, local storage only.</footer>
          </div>
        </div>
      );
    }

    function AddWordForm({ onAdd }) {
      const [w, setW] = useState("");
      const [h, setH] = useState("");
      return (
        <form onSubmit={(e) => { e.preventDefault(); onAdd(w, h); setW(""); setH(""); }} className="space-y-2">
          <input value={w} onChange={(e) => setW(e.target.value)} className="w-full p-2 border rounded" placeholder="new word" />
          <input value={h} onChange={(e) => setH(e.target.value)} className="w-full p-2 border rounded" placeholder="hint (optional)" />
          <div className="flex gap-2">
            <button className="px-3 py-2 border rounded">Add</button>
            <button type="button" onClick={() => { setW(""); setH(""); }} className="px-3 py-2 border rounded">Clear</button>
          </div>
        </form>
      );
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  </script>
</body>
</html>
