const UK_POSTCODE_MIN_LENGTH = 5;
const UK_POSTCODE_MAX_LENGTH = 7;
const INWARD_CODE_LENGTH = 3;

export const formatPostcode = (postcode: string): string => {
  const cleaned = postcode.replace(/\s+/gv, "").toUpperCase();

  if (
    cleaned.length < UK_POSTCODE_MIN_LENGTH ||
    cleaned.length > UK_POSTCODE_MAX_LENGTH
  ) {
    return cleaned;
  }

  const outwardEnd = cleaned.length - INWARD_CODE_LENGTH;
  return `${cleaned.slice(0, outwardEnd)} ${cleaned.slice(outwardEnd)}`;
};
