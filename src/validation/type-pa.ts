import { z } from "zod";

export const priorAuthorityEnum = z.enum(["Expert", "Expense", "Counsel"]);

export const typeOfPriorAuthority = z.object({
  PriorAuthorityType: priorAuthorityEnum,
});
