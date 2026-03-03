const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the PostCSS loader rules and add tailwindcss
      const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
      if (oneOfRule) {
        oneOfRule.oneOf.forEach((rule) => {
          if (rule.use) {
            rule.use.forEach((loader) => {
              if (
                loader.loader &&
                loader.loader.includes('postcss-loader')
              ) {
                const postcssOptions = loader.options?.postcssOptions;
                if (postcssOptions && postcssOptions.plugins) {
                  postcssOptions.plugins.push(
                    require('tailwindcss'),
                    require('autoprefixer')
                  );
                }
              }
            });
          }
        });
      }
      return webpackConfig;
    },
  },
};
