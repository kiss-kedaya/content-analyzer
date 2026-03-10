import { useReducer, useCallback } from 'react'

interface Content {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  score: number
  analyzedAt: Date
  analyzedBy?: string | null
  favorited: boolean
}

interface AdultContent extends Content {
  mediaUrls: string[]
}

interface State {
  activeTab: string
  orderBy: string
  techContents: Content[]
  adultContents: AdultContent[]
  techPage: number
  adultPage: number
  loading: boolean
  techHasMore: boolean
  adultHasMore: boolean
}

type Action =
  | { type: 'SET_TAB'; payload: string }
  | { type: 'SET_ORDER_BY'; payload: string }
  | { type: 'SET_TECH_CONTENTS'; payload: Content[] }
  | { type: 'SET_ADULT_CONTENTS'; payload: AdultContent[] }
  | { type: 'APPEND_TECH_CONTENTS'; payload: Content[] }
  | { type: 'APPEND_ADULT_CONTENTS'; payload: AdultContent[] }
  | { type: 'DELETE_TECH_CONTENT'; payload: string }
  | { type: 'DELETE_ADULT_CONTENT'; payload: string }
  | { type: 'SET_TECH_PAGE'; payload: number }
  | { type: 'SET_ADULT_PAGE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TECH_HAS_MORE'; payload: boolean }
  | { type: 'SET_ADULT_HAS_MORE'; payload: boolean }
  | { type: 'RESET_PAGINATION' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload }
    
    case 'SET_ORDER_BY':
      return { ...state, orderBy: action.payload }
    
    case 'SET_TECH_CONTENTS':
      return { ...state, techContents: action.payload }
    
    case 'SET_ADULT_CONTENTS':
      return { ...state, adultContents: action.payload }
    
    case 'APPEND_TECH_CONTENTS':
      return {
        ...state,
        techContents: [...state.techContents, ...action.payload]
      }
    
    case 'APPEND_ADULT_CONTENTS':
      return {
        ...state,
        adultContents: [...state.adultContents, ...action.payload]
      }
    
    case 'DELETE_TECH_CONTENT':
      return {
        ...state,
        techContents: state.techContents.filter(item => item.id !== action.payload)
      }
    
    case 'DELETE_ADULT_CONTENT':
      return {
        ...state,
        adultContents: state.adultContents.filter(item => item.id !== action.payload)
      }
    
    case 'SET_TECH_PAGE':
      return { ...state, techPage: action.payload }
    
    case 'SET_ADULT_PAGE':
      return { ...state, adultPage: action.payload }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_TECH_HAS_MORE':
      return { ...state, techHasMore: action.payload }
    
    case 'SET_ADULT_HAS_MORE':
      return { ...state, adultHasMore: action.payload }
    
    case 'RESET_PAGINATION':
      return {
        ...state,
        techPage: 1,
        adultPage: 1,
        techHasMore: true,
        adultHasMore: true
      }
    
    default:
      return state
  }
}

export function useContentListState(
  initialTechContents: Content[],
  initialAdultContents: AdultContent[],
  initialTab: string,
  initialOrderBy: string,
  initialPage: number
) {
  const [state, dispatch] = useReducer(reducer, {
    activeTab: initialTab,
    orderBy: initialOrderBy,
    techContents: initialTechContents,
    adultContents: initialAdultContents,
    techPage: initialTab === 'tech' ? initialPage : 1,
    adultPage: initialTab === 'adult' ? initialPage : 1,
    loading: false,
    techHasMore: true,
    adultHasMore: true,
  })

  // Actions
  const setTab = useCallback((tab: string) => {
    dispatch({ type: 'SET_TAB', payload: tab })
  }, [])

  const setOrderBy = useCallback((orderBy: string) => {
    dispatch({ type: 'SET_ORDER_BY', payload: orderBy })
  }, [])

  const setTechContents = useCallback((contents: Content[]) => {
    dispatch({ type: 'SET_TECH_CONTENTS', payload: contents })
  }, [])

  const setAdultContents = useCallback((contents: AdultContent[]) => {
    dispatch({ type: 'SET_ADULT_CONTENTS', payload: contents })
  }, [])

  const appendTechContents = useCallback((contents: Content[]) => {
    dispatch({ type: 'APPEND_TECH_CONTENTS', payload: contents })
  }, [])

  const appendAdultContents = useCallback((contents: AdultContent[]) => {
    dispatch({ type: 'APPEND_ADULT_CONTENTS', payload: contents })
  }, [])

  const deleteTechContent = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TECH_CONTENT', payload: id })
  }, [])

  const deleteAdultContent = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ADULT_CONTENT', payload: id })
  }, [])

  const setTechPage = useCallback((page: number) => {
    dispatch({ type: 'SET_TECH_PAGE', payload: page })
  }, [])

  const setAdultPage = useCallback((page: number) => {
    dispatch({ type: 'SET_ADULT_PAGE', payload: page })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }, [])

  const setTechHasMore = useCallback((hasMore: boolean) => {
    dispatch({ type: 'SET_TECH_HAS_MORE', payload: hasMore })
  }, [])

  const setAdultHasMore = useCallback((hasMore: boolean) => {
    dispatch({ type: 'SET_ADULT_HAS_MORE', payload: hasMore })
  }, [])

  const resetPagination = useCallback(() => {
    dispatch({ type: 'RESET_PAGINATION' })
  }, [])

  return {
    state,
    actions: {
      setTab,
      setOrderBy,
      setTechContents,
      setAdultContents,
      appendTechContents,
      appendAdultContents,
      deleteTechContent,
      deleteAdultContent,
      setTechPage,
      setAdultPage,
      setLoading,
      setTechHasMore,
      setAdultHasMore,
      resetPagination,
    },
  }
}
