const config = {
  '*.{ts,tsx,js,jsx,mjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,css,md,yml,yaml}': ['prettier --write'],
};

export default config;
