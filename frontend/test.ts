const PARAM_CONFIG = [{ key: "b" } as const];
const params = { b: 1 };
PARAM_CONFIG.map(({ key, ...rest }) => ({
  key: key,
  ...rest
}));
