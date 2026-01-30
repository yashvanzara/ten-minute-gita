declare const __DEV__: boolean;

export const logger = {
  error: (context: string, error: unknown) => {
    if (__DEV__) {
      console.error(`[${context}]`, error);
    }
  },
  warn: (context: string, message: string) => {
    if (__DEV__) {
      console.warn(`[${context}]`, message);
    }
  },
  info: (context: string, message: string) => {
    if (__DEV__) {
      console.log(`[${context}]`, message);
    }
  },
};
