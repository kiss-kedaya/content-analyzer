import { createContentAPI, ContentInput, OrderBy, validateOrderBy } from './content-api-factory'

export type { ContentInput, OrderBy }
export { validateOrderBy }

const contentAPI = createContentAPI('content', true)

export const createContent = contentAPI.create
export const getAllContents = contentAPI.getAll
export const getFavoriteContents = contentAPI.getFavorites
export const getContentVideoFeedSources = contentAPI.getVideoFeedSources
export const getContentsCount = contentAPI.getCount
export const getContentsPage = contentAPI.list
export const getContentsBySource = contentAPI.getBySource
export const getContentById = contentAPI.getById
export const deleteContent = contentAPI.delete
export const setContentFavorite = contentAPI.setFavorite
export const getStats = contentAPI.getStats
