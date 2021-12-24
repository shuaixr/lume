import { basename, extname } from "../deps/path.ts";
import { Exception } from "./errors.ts";
import AssetLoader from "./asset_loader.ts";

import type { Data, Dest, Loader, Page, Src } from "../core.ts";

/**
 * Class to load page files that generate HTML documents.
 * It's very similar to the AssetLoader, but it removes the extension
 * and ensure there's a `date` property in the data.
 */
export default class PageLoader extends AssetLoader {
  async load(path: string): Promise<Page | undefined> {
    const page = await super.load(path);

    if (!page) {
      return undefined;
    }

    // Subextensions, like styles.css.njk
    const subext = extname(page.dest.path);

    if (subext) {
      page.dest.path = page.dest.path.slice(0, -subext.length);
      page.dest.ext = subext;
    } else {
      page.dest.ext = "";
    }

    return page;
  }

  /** Loads the page data and prepare it */
  async loadData(page: Page, path: string, loader: Loader): Promise<Data> {
    const data = await super.loadData(page, path, loader);

    // Check the date and set it if it's not set
    if (!data.date) {
      data.date = this.#detectDateInPath(page.src, page.dest) ??
        page.src.created ?? page.src.lastModified;
    } else if (!(data.date instanceof Date)) {
      throw new Exception(
        'Invalid date. Use "yyyy-mm-dd" or "yyy-mm-dd hh:mm:ss" formats',
        { path },
      );
    }

    return data;
  }

  /**
   * Detect the date of the page in the filename
   * Example: 2019-01-01_hello-world.md
   */
  #detectDateInPath(src: Src, dest: Dest): Date | undefined {
    const fileName = basename(src.path);

    const dateInPath = fileName.match(
      /^(\d{4})-(\d\d)-(\d\d)(?:-(\d\d)-(\d\d)(?:-(\d\d))?)?_/,
    );

    if (dateInPath) {
      const [found, year, month, day, hour, minute, second] = dateInPath;
      dest.path = dest.path.replace(found, "");

      return new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hour ? parseInt(hour) : 0,
        minute ? parseInt(minute) : 0,
        second ? parseInt(second) : 0,
      ));
    }

    const orderInPath = fileName.match(/^(\d+)_/);

    if (orderInPath) {
      const [found, timestamp] = orderInPath;
      dest.path = dest.path.replace(found, "");
      return new Date(parseInt(timestamp));
    }
  }
}