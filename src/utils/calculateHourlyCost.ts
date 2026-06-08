interface CalculateHourlyCostInput {
  hourlyRate: string;
  estimatedHours: string;
  estimatedMinutes: string;
}

export const calculateHourlyCost = ({
  hourlyRate,
  estimatedHours,
  estimatedMinutes,
}: CalculateHourlyCostInput): string => {
  const parsedHourlyRate = parseFloat(hourlyRate);
  const parsedEstimatedHours = parseInt(estimatedHours, 10);
  const parsedEstimatedMinutes = parseInt(estimatedMinutes, 10);
  const totalCost =
    parsedHourlyRate * (parsedEstimatedHours + parsedEstimatedMinutes / 60);

  return (Math.round(totalCost * 100) / 100).toFixed(2);
};
