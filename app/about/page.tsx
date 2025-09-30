export const dynamic = 'force-static';

export default function AboutPage() {
  const team = [
    { name: 'Matthew Cruz', role: 'Developer', linkedin: '#', image: '/IMG_6798.png' },
    { name: 'Will Morrison', role: 'Developer', linkedin: '#', image: '/1725477011305.jpg' },
    { name: 'Jesus Aguilar', role: 'Developer', linkedin: '#', image: '/474660624_612690794801069_3667055654377803390_n.jpg' },
    { name: 'Lakshya Dhingra', role: 'Developer', linkedin: 'https://www.linkedin.com/in/lakshya-dhingra/', image: '/1709827845387.jpg' },
  ];

  return (
    <main>
      <div className="w-full max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-2 text-center text-zinc-900 dark:text-white">About Us</h1>
        <p className="text-center text-zinc-600 dark:text-zinc-400 mb-8">Building smarter cooking with AI—recipes, timers, and more.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map((m, i) => (
            <div key={i} className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 flex flex-col items-center text-center">
              <img src={m.image} alt={m.name} className="w-24 h-24 rounded-full object-cover mb-4 border border-zinc-200 dark:border-zinc-700" />
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{m.name}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{m.role}</p>
              <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-medium">
                LinkedIn
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Our Story</h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            We built this at SunHacks 2025 to make cooking easier: paste a recipe link, extract ingredients and steps, and get smart inline timers. The goal: reduce friction, keep you in flow, and make good food.
          </p>
          <p className="text-zinc-700 dark:text-zinc-300 mt-3">
            As college students, we constantly struggle with deciding what to cook with the few random ingredients we have on hand. Ordering food is expensive, and recipes online often assume a fully stocked pantry. We wanted to solve this problem by creating a tool that helps students find quick, simple recipes based on ingredients they already have, while also pointing them to nearby grocery stores for the missing items.
          </p>
        </div>
      </div>
    </main>
  );
}
