export const BRAND_NAME = 'SkyServe'
export const BRAND_TAGLINE = 'In-flight meal ordering'

export function pageTitle(section) {
  return section ? `${BRAND_NAME} | ${section}` : BRAND_NAME
}
