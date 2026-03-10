import { createContentAPI, ContentInput, OrderBy, validateOrderBy } from './content-api-factory'

export { ContentInput, OrderBy, validateOrderBy }

const contentAPI = createContentAPI('content', true)

export const createContent = contentAPI.create
export const getAllContents = contentAPI.getAll
export const getContentsCount = contentAPI.getCount
export const getContentsBySource = contentAPI.getBySource
export const getContentById = contentAPI.getById
export const deleteContent = contentAPI.delete
export const getStats = contentAPI.getStats
