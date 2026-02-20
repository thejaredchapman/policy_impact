import { z } from "zod";

export const impactProfileSchema = z
  .object({
    sex: z.string().optional(),
    maritalStatus: z.string().optional(),
    sexualOrientation: z.string().optional(),
    religion: z.string().optional(),
    ethnicity: z.string().optional(),
    salaryBracket: z.string().optional(),
    usState: z.string().optional(),
    politicalAffiliation: z.string().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v), {
    message: "At least one demographic field is required.",
  });

export const summarizeSchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters."),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});
