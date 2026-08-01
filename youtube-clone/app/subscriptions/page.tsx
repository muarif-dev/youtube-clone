import Link from "next/link";

const subscribers = [
  { name: "Maya Johnson", description: "Creator and community leader", joined: "Mar 2026" },
  { name: "Leo Mitchell", description: "Full-stack mentor", joined: "Apr 2026" },
  { name: "Ava Brooks", description: "Design and frontend specialist", joined: "May 2026" },
  { name: "Noah Diaz", description: "Tech reviewer and streamer", joined: "Jun 2026" },
  { name: "Zoe Carter", description: "Learning content curator", joined: "Jul 2026" },
];

export default function SubscriptionsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-red-500">Subscriptions</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Your Subscription Feed</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-slate-800"
          >
            Back to Home
          </Link>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {subscribers.map((subscriber) => (
              <div key={subscriber.name} className="rounded-3xl border border-slate-800 bg-slate-950/95 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-slate-700" />
                  <div>
                    <p className="text-base font-semibold text-white">{subscriber.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{subscriber.description}</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Subscribed</p>
                    <p className="mt-1 text-sm text-slate-300">{subscriber.joined}</p>
                  </div>
                  <button className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-400">
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
