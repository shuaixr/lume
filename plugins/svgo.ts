import Site from "../site.ts";
import { optimize } from "../deps/svgo.ts";
import { merge } from "../utils.ts";
import { Page } from "../filesystem.ts";

interface Options {
  extensions: string[];
  options: {
    [index: string]: unknown;
  };
}

// Default options
const defaults: Options = {
  extensions: [".svg"],
  options: {},
};

/**
 * Plugin to load all .svg files and minify them
 * using SVGO
 */
export default function (userOptions: Partial<Options>) {
  const options = merge(defaults, userOptions);

  return (site: Site) => {
    site.loadAssets(options.extensions);
    site.process(options.extensions, svg);

    async function svg(page: Page) {
      const path = site.src(page.dest.path + page.dest.ext);
      const result = await optimize(page.content, {
        path,
        ...options.options,
      }) as { data: string };

      page.content = result.data;
    }
  };
}