"use client";

import { useState } from "react";
import Link from "next/link";

const exercises = [
  { id: "e1", name: "Quad sets", target: 3, sets: "3 × 10 reps", done: 3, video: "▶" },
  { id: "e2", name: "Heel slides", target: 3, sets: "3 × 15 reps", done: 3, video: "▶" },
  { id: "e3", name: "Straight leg raises", target: 3, sets: "3 × 10 reps", done: 2, video: "▶" },
  { id: "e4", name: "Standing knee flexion", target: 3, sets: "3 × 12 reps", done: 0, video: "▶" },
  { id: "e5", name: "Mini squats (chair-assist)", target: 3, sets: "3 × 8 reps", done: 0, video: "▶" },
];

const messages = [
  { from: "Alex Rivera, DPT", body: "How did the heel slides feel today? Any sharp pain?", time: "9:14 AM" },
  { from: "you", body: "Heel slides are getting easier. Some tightness still around 90 degrees.", time: "10:02 AM" },
  { from: "Alex Rivera, DPT", body: "That's normal at week 2 post-op. Keep going — we'll work on flexion in person Thursday.", time: "10:08 AM" },
];

export default function PatientAppPage() {
  const [pain, setPain] = useState(4);
  const [tab, setTab] = useState<"today" | "progress" | "messages">("today");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal-900">Patient mobile experience</h1>
        <p className="text-sm text-stone-600 mt-1">
          This is what your patient sees on their phone every morning. Cadence streams
          their adherence back to your clinic dashboard automatically — and that data
          is what justifies the RTM billing codes.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
        {/* Phone frame */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="relative origin-top scale-90 sm:scale-100">
            {/* iPhone outer frame */}
            <div className="rounded-[3rem] bg-stone-900 p-3 shadow-2xl" style={{ width: 320, height: 660 }}>
              {/* Screen */}
              <div className="rounded-[2.3rem] bg-gradient-to-br from-teal-50 to-cream-100 h-full overflow-hidden relative flex flex-col">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-stone-900 rounded-b-3xl z-10" />

                {/* Status bar */}
                <div className="pt-3 px-6 flex justify-between items-center text-[10px] font-semibold text-stone-800 mt-1">
                  <span>9:41</span>
                  <span className="flex gap-1">
                    <span>●●●</span><span>📶</span><span>🔋</span>
                  </span>
                </div>

                {/* App header */}
                <div className="px-5 pt-3 pb-2">
                  <div className="text-[10px] uppercase tracking-wide text-teal-700 font-bold">
                    Cadence
                  </div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">
                    Good morning, Patricia
                  </div>
                  <div className="text-[11px] text-stone-600 mt-0.5">
                    Day 14 of your recovery plan
                  </div>
                </div>

                {/* Tab pills */}
                <div className="flex gap-1 px-4 pb-2">
                  {(["today", "progress", "messages"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 text-[10px] font-semibold py-1.5 rounded-full capitalize ${
                        tab === t ? "bg-teal-700 text-white" : "bg-white text-stone-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {tab === "today" && (
                    <div className="space-y-3">
                      {/* Pain check-in */}
                      <div className="bg-white rounded-2xl p-3 shadow-sm">
                        <div className="text-[10px] font-semibold uppercase text-stone-500 mb-1">
                          How is your pain today?
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-stone-500">No pain</span>
                          <span className="text-2xl font-bold text-teal-700">{pain}</span>
                          <span className="text-[11px] text-stone-500">Worst</span>
                        </div>
                        <input
                          type="range"
                          aria-label="Pain level today (0 is no pain, 10 is worst)"
                          aria-valuetext={`${pain} out of 10`}
                          min={0}
                          max={10}
                          value={pain}
                          onChange={(e) => setPain(parseInt(e.target.value))}
                          className="w-full h-2 accent-teal-700"
                        />
                        <button className="bg-teal-700 text-white text-[11px] font-semibold px-4 py-2 rounded-full w-full mt-2">
                          Log today
                        </button>
                      </div>

                      {/* Exercises */}
                      <div>
                        <div className="text-[10px] font-semibold uppercase text-stone-500 mb-2 px-1">
                          Today's exercises
                        </div>
                        <div className="space-y-2">
                          {exercises.map((ex) => {
                            const complete = ex.done >= ex.target;
                            return (
                              <div key={ex.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg ${complete ? "bg-emerald-600" : "bg-teal-600"}`}>
                                  {complete ? "✓" : ex.video}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-stone-900 truncate">
                                    {ex.name}
                                  </div>
                                  <div className="text-[10px] text-stone-600">{ex.sets}</div>
                                </div>
                                <div className="text-[10px] font-bold text-stone-700">
                                  {ex.done}/{ex.target}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === "progress" && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="text-[10px] font-semibold uppercase text-stone-500 mb-1">
                          Current streak
                        </div>
                        <div className="text-3xl font-bold text-teal-700">14 days</div>
                        <div className="text-[10px] text-stone-600 mt-1">
                          Best streak: 14 days · Started 14 days ago
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="text-[10px] font-semibold uppercase text-stone-500 mb-2">
                          Pain trend (last 14 days)
                        </div>
                        <div className="h-20 flex items-end gap-1">
                          {[7,7,6,7,6,6,5,5,5,4,5,4,4,4].map((v, i) => (
                            <div key={i} className="flex-1 bg-teal-500 rounded-t" style={{ height: `${v * 10}%` }} />
                          ))}
                        </div>
                        <div className="text-[10px] text-stone-600 mt-2">
                          ▼ Down 43% from week 1
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="text-[10px] font-semibold uppercase text-stone-500 mb-2">
                          Exercise adherence
                        </div>
                        <div className="text-2xl font-bold text-emerald-600">87%</div>
                        <div className="text-[10px] text-stone-600 mt-1">
                          Above the 80% threshold for full RTM billing
                        </div>
                      </div>
                    </div>
                  )}

                  {tab === "messages" && (
                    <div className="space-y-2">
                      {messages.map((m, i) => (
                        <div
                          key={i}
                          className={`rounded-2xl p-2.5 max-w-[80%] text-[11px] ${
                            m.from === "you"
                              ? "bg-teal-700 text-white ml-auto"
                              : "bg-white text-stone-900"
                          }`}
                        >
                          {m.from !== "you" && (
                            <div className="text-[9px] font-semibold text-teal-700 mb-0.5">
                              {m.from}
                            </div>
                          )}
                          <div>{m.body}</div>
                          <div className={`text-[9px] mt-0.5 ${m.from === "you" ? "text-teal-100" : "text-stone-500"}`}>
                            {m.time}
                          </div>
                        </div>
                      ))}
                      <div className="bg-white rounded-2xl p-2 mt-3 flex gap-2">
                        <input
                          aria-label="Message your therapist"
                          className="flex-1 text-[11px] bg-transparent outline-none placeholder:text-stone-500"
                          placeholder="Message your therapist..."
                        />
                        <button className="bg-teal-700 text-white text-[10px] font-semibold px-3 py-1 rounded-full">
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What this generates for the clinic */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
              What patient activity unlocks for the clinic
            </h3>
            <ul className="space-y-3 text-sm text-stone-700">
              <li className="flex gap-3">
                <div className="text-emerald-600 text-lg">✓</div>
                <div>
                  <strong className="text-stone-900">Every pain check-in</strong> qualifies as
                  documented patient interaction for CPT 98977 (RTM monitoring,
                  $40/month per Medicare patient).
                </div>
              </li>
              <li className="flex gap-3">
                <div className="text-emerald-600 text-lg">✓</div>
                <div>
                  <strong className="text-stone-900">Every exercise completion</strong> proves
                  adherence — required if the patient or payer challenges the
                  monthly management code (CPT 98980, $50.45/month).
                </div>
              </li>
              <li className="flex gap-3">
                <div className="text-emerald-600 text-lg">✓</div>
                <div>
                  <strong className="text-stone-900">Therapist replies in-app</strong> count
                  toward the 20-minute monthly management threshold. Cadence
                  tracks reply time automatically.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="text-emerald-600 text-lg">✓</div>
                <div>
                  <strong className="text-stone-900">Adherence drops alert the therapist</strong> — if a
                  patient logs 3 days of missed exercises, the dashboard flags
                  them for a check-in call before they drop out of care.
                </div>
              </li>
            </ul>
          </div>

          <div className="card p-5 bg-teal-50 border-teal-200">
            <h3 className="text-sm font-bold uppercase tracking-wide text-teal-800 mb-2">
              Why the patient comes back to the app daily
            </h3>
            <div className="text-sm text-teal-900 leading-relaxed">
              The streak counter is intentional — patients who log a check-in 7 days in a
              row are 4× more likely to complete their plan of care.
              No more "I forgot what exercises I'm supposed to do"
              calls to the front desk. No more hand-written exercise sheets that
              end up in a kitchen drawer.
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-stone-700 mb-3">
              Switch the demo
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setTab("today")} className="btn-secondary text-xs">
                Today
              </button>
              <button onClick={() => setTab("progress")} className="btn-secondary text-xs">
                Progress
              </button>
              <button onClick={() => setTab("messages")} className="btn-secondary text-xs">
                Messages
              </button>
            </div>
            <p className="text-xs text-stone-500 mt-3">
              Tap the tabs on the phone too — both work.
            </p>
            <Link href="/rtm" className="text-xs text-teal-700 hover:text-teal-900 mt-3 inline-block">
              ← Back to RTM dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
