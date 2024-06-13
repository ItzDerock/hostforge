/* eslint-disable */
// @ts-nocheck

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    // will fix linting closer to a stable release
    ignoreDuringBuilds: true,
  },

  experimental: {
    esmExternals: "loose",
  },

  /**
   */
  webpack: (config, { isServer }) => {
    // Exclude .node files from bundling
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });

    // Ensure webpack doesn't try to bundle native modules
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push(({ request }, callback) => {
        if (/sshcrypto\.node$/.test(request)) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      });
    }

    return config;
  },
};

export default config;
