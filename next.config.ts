import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/api-schema-endpoint-counter",
  assetPrefix: "/api-schema-endpoint-counter",
  reactStrictMode: false,
  output: "export",
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: "raw-loader",
    });
    config.module.rules.push({
      test: /\.json$/,
      type: 'javascript/auto', // Important to override Next.js default JSON handling
      use: [
        {
          loader: 'raw-loader',
        },
      ],
    });
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: "raw-loader",
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
