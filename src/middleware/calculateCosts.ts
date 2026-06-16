import { expertCostsCalculationSchema } from "#src/validation/priorAuthority.js";
import { calculateHourlyCost } from "#src/utils/calculateHourlyCost.js";
import z from "zod";
import type { NextFunction, Request, Response } from "express";

const actionSchema = z.object({ _action: z.string().optional() });
const calculateCostsBodySchema = z.looseObject({
  _action: z.string().optional(),
  PriorAuthorityBillingType: z.enum(["Hourly", "Fixed rate"]).optional(),
  PriorAuthorityHourlyRate: z.string().optional(),
  PriorAuthorityEstimatedTime: z
    .object({
      PriorAuthorityEstimatedHours: z.string().optional(),
      PriorAuthorityEstimatedMinutes: z.string().optional(),
    })
    .optional(),
  PriorAuthorityFixedRateTotalAmount: z.string().optional(),
});

interface TreeifiedError {
  errors?: string[];
  properties?: Record<string, { errors?: string[] }>;
}

type CalculateCostsBody = z.infer<typeof calculateCostsBodySchema>;

export const calculateCosts = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const body: CalculateCostsBody = calculateCostsBodySchema.parse(req.body);
  const { _action } = actionSchema.parse(body);

  if (_action === "calculate") {
    const result = expertCostsCalculationSchema.safeParse(body);

    if (!result.success) {
      const treeified = z.treeifyError(result.error) as TreeifiedError;
      const fieldErrors = treeified.properties || {};
      const errors = Object.entries(fieldErrors).map(([key, value]) => ({
        text: value.errors?.[0] || "Invalid input",
        href: `#${key}`,
      }));
      const errorMap: Record<string, string> = {};

      Object.entries(fieldErrors).forEach(([key, value]) => {
        if (value.errors && value.errors.length > 0) {
          errorMap[key] = value.errors[0];
        }
      });

      res.render("priorAuthorityForm/expert/expertCosts", {
        errors,
        errorMap,
        values: body,
        priorAuthority: req.session.priorAuthority ?? {},
      });
      return;
    }

    const calculatedTotal = getCalculatedTotal(result.data);

    res.render("priorAuthorityForm/expert/expertCosts", {
      values: body,
      calculatedTotal,
      priorAuthority: req.session.priorAuthority ?? {},
    });
    return;
  }

  next();
};

const getCalculatedTotal = (
  data: z.infer<typeof expertCostsCalculationSchema>,
): string | undefined => {
  if (data.PriorAuthorityBillingType !== "Hourly") {
    return data.PriorAuthorityFixedRateTotalAmount;
  }

  return calculateHourlyCost({
    hourlyRate: data.PriorAuthorityHourlyRate ?? "0",
    estimatedHours:
      data.PriorAuthorityEstimatedTime?.PriorAuthorityEstimatedHours ?? "0",
    estimatedMinutes:
      data.PriorAuthorityEstimatedTime?.PriorAuthorityEstimatedMinutes ?? "0",
  });
};
