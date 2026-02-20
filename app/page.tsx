import { EolScanForm } from "./components/EolScanForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-900 font-sans text-zinc-100">
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <EolScanForm />
      </main>
    </div>
  );
}
