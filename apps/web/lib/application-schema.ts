import { z } from "zod";

export const locationOptions = ["India", "US"] as const;
export const incomeOptions = ["₹25L–₹1Cr", "$100k–$250k", "Other"] as const;
export const savingsRateOptions = ["<10", "10–20", "20–25", "25–35", "35+"] as const;
export const portfolioOptions = ["<₹25L", "₹25–75L", "₹75L–₹2Cr", "₹2Cr+"] as const;

export const applicationSchema = z
  .object({
    spouse1Name: z.string().min(2, "Required"),
    spouse2Name: z.string().optional(),
    email: z.string().email("Enter a valid email"),
    phone: z.string().optional(),
    location: z.enum(locationOptions),
    incomeRange: z.enum(incomeOptions),
    currentSavingsRate: z.enum(savingsRateOptions),
    portfolioRange: z.enum(portfolioOptions),
    biggestGoal: z.string().min(20, "Tell us your goal in at least 20 characters"),
    biggestWorry: z.string().min(20, "Tell us your worry in at least 20 characters"),
    spouseAttendanceConfirmed: z.boolean()
  })
  .superRefine((values, context) => {
    const spouse2 = values.spouse2Name?.trim() ?? "";
    const applyingAsCouple = spouse2.length > 0;

    if (applyingAsCouple && spouse2.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter at least 2 characters for spouse/partner name.",
        path: ["spouse2Name"]
      });
    }

    if (applyingAsCouple && !values.spouseAttendanceConfirmed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "For couple applications, both partners must commit to quarterly sessions.",
        path: ["spouseAttendanceConfirmed"]
      });
    }
  });

export type ApplicationValues = z.infer<typeof applicationSchema>;

export interface ApplicationRecord extends ApplicationValues {
  id: string;
  submittedAt: string;
  fit: "in-fit" | "out-of-fit";
}
