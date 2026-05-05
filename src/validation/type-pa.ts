import z from "#node_modules/zod/index.cjs";

export const typeOfPriorAuthority = 
  z.enum("Expert" | "Expense" | "Counsel"),

