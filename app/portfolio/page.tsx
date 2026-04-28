import { PortfolioFeed } from "@/components/PortfolioFeed";

export default function PortfolioPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Portfolio</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Community work from freelancers and creatives. Scroll like a social feed — like or save posts to revisit later.
      </p>
      <div className="mt-10">
        <PortfolioFeed />
      </div>
    </div>
  );
}
