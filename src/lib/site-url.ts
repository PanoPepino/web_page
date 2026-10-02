const siteOrigin = "https://panopepino.github.io";

/** Resolve files and routes inside this deployment, including its Pages base. */
export const publicUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export const siteUrl = (path: string) => `${siteOrigin}${publicUrl(path)}`;
