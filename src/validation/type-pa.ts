import { z } from "zod";

export const typeOfPriorAuthority = z.enum(["Expert", "Expense", "Counsel"]);
