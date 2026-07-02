import { EolScanForm } from "./components/EolScanForm";
import { SimulationConfigModalDev } from "./components/SimulationConfigModalDev";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900">
      <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-4 py-12">
        <SimulationConfigModalDev />
        <EolScanForm />
      </main>
    </div>
  );
}
