import { CompoundCalculator } from "./compound-calculator";
import { FICalculator } from "./fi-calculator";
import { SavingsGuardCalculator } from "./savings-guard-calculator";
import { WithdrawalCalculator } from "./withdrawal-calculator";

export function ToolsSuite() {
  return (
    <div className="space-y-6">
      <CompoundCalculator />
      <FICalculator />
      <SavingsGuardCalculator />
      <WithdrawalCalculator />
    </div>
  );
}
