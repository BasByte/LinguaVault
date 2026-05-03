"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Send, Trophy } from "lucide-react";
import { getCEFRColor, cn } from "@/lib/utils";

interface Question {
  id: number;
  question: string;
  question_type: string;
  options: string[] | null;
  points: number;
  order_index: number;
}

interface TestInterfaceProps {
  testId: number;
  questions: Question[];
  durationMinutes: number;
  passingScore: number;
  cefrLevel: string;
}

type Phase = "intro" | "test" | "submitting" | "result";

interface ResultData {
  score: number;
  maxScore: number;
  percentage: number;
  cefrResult: string;
  passed: boolean;
  pointsEarned: number;
}

export default function TestInterface({ testId, questions, durationMinutes, passingScore, cefrLevel }: TestInterfaceProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fillInput, setFillInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [startTime, setStartTime] = useState<number>(0);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState("");

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const answered = Object.keys(answers).length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const submitTest = useCallback(async (currentAnswers: Record<string, string>, elapsed: number) => {
    setPhase("submitting");
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_id: testId, answers: currentAnswers, time_spent_seconds: elapsed }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Submission failed"); setPhase("test"); return; }
      setResult(data);
      setPhase("result");
    } catch {
      setError("Network error. Please try again.");
      setPhase("test");
    }
  }, [testId]);

  useEffect(() => {
    if (phase !== "test") return;
    if (timeLeft <= 0) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      submitTest(answers, elapsed);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft, answers, startTime, submitTest]);

  const startTest = () => {
    setStartTime(Date.now());
    setPhase("test");
  };

  const handleAnswer = (answer: string) => {
    const q = questions[currentQ];
    setAnswers(prev => ({ ...prev, [q.id.toString()]: answer }));
    setFillInput("");
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(c => c + 1), 300);
    }
  };

  const currentQuestion = questions[currentQ];
  const currentAnswer = answers[currentQuestion?.id?.toString()];
  const progressPct = (answered / questions.length) * 100;
  const timePct = (timeLeft / (durationMinutes * 60)) * 100;

  if (phase === "intro") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Ready to begin?</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-xl p-4">
            <p className="text-xs text-indigo-500 font-semibold mb-1">Questions</p>
            <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">{questions.length}</p>
          </div>
          <div className="bg-sky-50 dark:bg-sky-950/50 rounded-xl p-4">
            <p className="text-xs text-sky-500 font-semibold mb-1">Time Limit</p>
            <p className="text-2xl font-black text-sky-700 dark:text-sky-300">{durationMinutes} min</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/50 rounded-xl p-4">
            <p className="text-xs text-amber-500 font-semibold mb-1">Total Points</p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{totalPoints}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/50 rounded-xl p-4">
            <p className="text-xs text-green-500 font-semibold mb-1">Passing Score</p>
            <p className="text-2xl font-black text-green-700 dark:text-green-300">{passingScore}%</p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6 text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>• Answer all questions within the time limit</p>
          <p>• Some questions advance automatically after you answer</p>
          <p>• Your score will be displayed immediately after submission</p>
          <p>• Results are aligned with the CEFR framework</p>
        </div>
        <button onClick={startTest} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-sm hover:shadow-md text-lg">
          Start Assessment
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">{result.passed ? "🎉" : "📚"}</div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
          {result.passed ? "Congratulations!" : "Keep Practicing!"}
        </h2>

        <div className="inline-flex items-center gap-2 mb-6">
          <span className="text-gray-600 dark:text-gray-400">Your CEFR Level:</span>
          <span className={cn("px-4 py-1.5 rounded-full font-black text-xl border-2", getCEFRColor(result.cefrResult))}>
            {result.cefrResult}
          </span>
        </div>

        <div className="relative w-36 h-36 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#e5e7eb" strokeWidth="10" fill="none" className="dark:stroke-gray-700" />
            <circle cx="50" cy="50" r="40" stroke={result.passed ? "#22c55e" : "#f59e0b"} strokeWidth="10" fill="none"
              strokeDasharray={`${result.percentage * 2.51} 251`} strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{result.percentage}%</span>
            <span className="text-xs text-gray-400">Score</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="text-xl font-black text-gray-900 dark:text-white">{result.score}</div>
            <div className="text-xs text-gray-500">Points</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="text-xl font-black text-gray-900 dark:text-white">{result.maxScore}</div>
            <div className="text-xs text-gray-500">Max Points</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/50 rounded-xl p-3">
            <div className="text-xl font-black text-amber-700 dark:text-amber-300">+{result.pointsEarned}</div>
            <div className="text-xs text-amber-500">XP Earned</div>
          </div>
        </div>

        {result.passed ? (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
            <div className="text-left">
              <p className="font-bold text-green-800 dark:text-green-400">Test Passed!</p>
              <p className="text-sm text-green-700 dark:text-green-500">You achieved the {cefrLevel} level. Keep up the great work!</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4 mb-6 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-amber-600 shrink-0" />
            <div className="text-left">
              <p className="font-bold text-amber-800 dark:text-amber-400">Almost there!</p>
              <p className="text-sm text-amber-700 dark:text-amber-500">Study more and retake the test to improve your score.</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.push("/assess")} className="flex-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition-all">
            Browse More Tests
          </button>
          <button onClick={() => router.push("/assess/my-results")} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
            <Trophy className="h-4 w-4" /> My Results
          </button>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-12 text-center">
        <div className="animate-spin w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-semibold">Calculating your results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      {/* Progress & Timer bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Question {currentQ + 1} of {questions.length}
          </span>
          <div className={cn("flex items-center gap-1.5 text-sm font-bold", timePct < 20 ? "text-red-600" : "text-gray-700 dark:text-gray-300")}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
          <span>{answered} answered</span>
          <span>{questions.length - answered} remaining</span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{currentQuestion.question}</h2>
          <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full font-bold shrink-0">{currentQuestion.points} pts</span>
        </div>

        {currentQuestion.options && (
          <div className="grid gap-3">
            {currentQuestion.options.map((opt: string) => (
              <button key={opt} onClick={() => handleAnswer(opt)}
                className={cn(
                  "text-left px-5 py-4 rounded-xl border-2 font-medium text-sm transition-all",
                  currentAnswer === opt
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-gray-700 dark:text-gray-300"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {!currentQuestion.options && (
          <div className="space-y-3">
            <input
              type="text"
              value={fillInput}
              onChange={e => setFillInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fillInput.trim() && handleAnswer(fillInput.trim())}
              placeholder="Type your answer..."
              className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all"
              autoFocus
            />
            <button onClick={() => fillInput.trim() && handleAnswer(fillInput.trim())} disabled={!fillInput.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all">
              Submit Answer
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={() => setCurrentQ(c => Math.max(0, c - 1))} disabled={currentQ === 0}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm transition-all">
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>

        <div className="flex gap-1 flex-wrap justify-center max-w-xs">
          {questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrentQ(i)}
              className={cn(
                "w-7 h-7 rounded-lg text-xs font-bold transition-all",
                i === currentQ ? "bg-indigo-600 text-white" :
                answers[q.id.toString()] ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ(c => Math.min(questions.length - 1, c + 1))}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl text-sm transition-all">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => submitTest(answers, Math.round((Date.now() - startTime) / 1000))}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-all">
            <Send className="h-4 w-4" /> Submit Test
          </button>
        )}
      </div>
    </div>
  );
}
