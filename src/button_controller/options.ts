export const makeOptions = (
  opt: Partial<ButtonControllerOpt>,
): ButtonControllerOpt => ({
  debug: false,
  ...opt,
});
