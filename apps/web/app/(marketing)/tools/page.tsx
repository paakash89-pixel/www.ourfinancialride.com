import type { Metadata } from "next";
import { ToolsSuite } from "../../../components/tools/tools-suite";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Four simple calculators: compounding, FI planning, savings rate, and withdrawal sustainability."
};

export default function ToolsPage() {
  return (
    <main className="page-shell py-12 sm:py-16">
      <section className="card animate-fade-up p-7 sm:p-10">
        <h1 className="text-4xl font-semibold tracking-tight text-slateBlue-700 sm:text-5xl">Free Tools</h1>
        <p className="box-copy mt-4 w-full text-base leading-7 text-slateBlue-500">
          Simple calculators with conservative assumptions and clear outputs.
        </p>
        <p className="box-copy mt-2 w-full text-sm text-slateBlue-500">
          Starter values use practical family income targets: about $150,000 (US) and ₹48,00,000
          (India).
        </p>
        <p className="box-copy mt-2 w-full text-sm text-slateBlue-500">
          Use the India/US toggle to switch currency, chart scale, and number format.
        </p>
      </section>

      <div className="mt-8">
        <ToolsSuite />
      </div>
    </main>
  );
}
