import type { NextConfig } from "next";
const config: NextConfig = { output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined };
export default config;
