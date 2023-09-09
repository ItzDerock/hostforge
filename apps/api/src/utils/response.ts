/**
 * A successful response
 * @param data - the data to be returned
 * @returns
 */
export const success = <T = undefined>(data?: T) => ({
  success: true,
  data,
});

/**]
 * An error response
 * @param error - the error to be returned
 */
export const error = <T = undefined>(errorMessage?: T) => ({
  success: false,
  error: errorMessage,
});
