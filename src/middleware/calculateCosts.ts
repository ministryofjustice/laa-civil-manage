import { expertCostsCalculationSchema } from "#src/validation/prior-authority.js";
import z from "zod";
import type { NextFunction, Request, Response } from "express";

const actionSchema = z.object({ _action: z.string().optional() });
const calculateCostsBodySchema = z.looseObject({
  _action: z.string().optional(),
  PriorAuthorityBillingType: z.enum(["Hourly", "Fixed cost"]).optional(),
  PriorAuthorityHourlyRate: z.string().optional(),
  PriorAuthorityEstimatedTime: z
    .object({
      PriorAuthorityEstimatedHours: z.string().optional(),
      PriorAuthorityEstimatedMinutes: z.string().optional(),
    })
    .optional(),
  PriorAuthorityFlatRateTotalAmount: z.string().optional(),
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

      res.render("pa-form/expert-costs", {
        errors,
        errorMap,
        values: body,
        priorAuthority: req.session.priorAuthority ?? {},
      });
      return;
    }

    const calculatedTotal =
      result.data.PriorAuthorityBillingType === "Hourly"
        ? (() => {
            const hourlyRate = parseFloat(
              result.data.PriorAuthorityHourlyRate ?? "0",
            );
            const estimatedHours = parseInt(
              result.data.PriorAuthorityEstimatedTime
                ?.PriorAuthorityEstimatedHours ?? "0",
              10,
            );
            const estimatedMinutes = parseInt(
              result.data.PriorAuthorityEstimatedTime
                ?.PriorAuthorityEstimatedMinutes ?? "0",
              10,
            );
            const totalCost =
              hourlyRate * (estimatedHours + estimatedMinutes / 60);

            return (Math.round(totalCost * 100) / 100).toFixed(2);
          })()
        : result.data.PriorAuthorityFlatRateTotalAmount;

    res.render("pa-form/expert-costs", {
      values: body,
      calculatedTotal,
      priorAuthority: req.session.priorAuthority ?? {},
    });
    return;
  }

  next();
};
