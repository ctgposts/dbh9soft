module.exports = {
  plugins: {
    tailwindcss: {
      config: './tailwind.config.js',
    },
    autoprefixer: {
      overrideBrowserslist: [
        'defaults',
        'not IE 11',
      ],
    },
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeUnicode: false,
        }],
      },
    }),
  },
};
