// Utility to safely handle Select values - shadcn doesn't allow empty strings
export const safeSelectValue = (v?: string | null): string | undefined => {
  return v === "" || v === null || v === undefined ? undefined : v;
};