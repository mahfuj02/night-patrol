const config = {
  extends: ['@commitlint/config-conventional'],
  // Dependabot writes subjects like "ci(deps): Bump actions/checkout from 4 to 7". They are valid
  // conventional commits except for the capital "B", which subject-case rejects, and we cannot
  // change what the bot writes. Everyone else is still checked.
  ignores: [(message) => /^Signed-off-by: dependabot\[bot\]/m.test(message)],
  rules: {
    'body-max-line-length': [0],
  },
};

export default config;
