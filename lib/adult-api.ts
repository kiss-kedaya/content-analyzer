import { createContentAPI, AdultContentInput, OrderBy, validateOrderBy } from './content-api-factory'

export type { AdultContentInput, OrderBy }
export { validateOrderBy }

const adultContentAPI = createContentAPI('adultContent', false)

export const createAdultContent = adultContentAPI.create
export const getAllAdultContents = adultContentAPI.getAll
export const getAdultContentsCount = adultContentAPI.getCount
export const getAdultContentById = adultContentAPI.getById
export const deleteAdultContent = adultContentAPI.delete
export const getAdultContentStats = adultContentAPI.getStats
