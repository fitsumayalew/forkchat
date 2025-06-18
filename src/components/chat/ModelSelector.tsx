import { useState, useRef, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { models } from '../../lib/models'
import { ScrollArea } from '@/components/ui/scroll-area'

type ModelId = keyof typeof models

const CAPABILITY_FILTERS = [
  { key: 'fast', label: 'Fast', icon: '⚡' },
  { key: 'images', label: 'Vision', icon: '🖼️' },
  { key: 'search', label: 'Search', icon: '🔍' },
  { key: 'pdfs', label: 'PDFs', icon: '📄' },
  { key: 'reasoning', label: 'Reasoning', icon: '🧠' },
  { key: 'imageGeneration', label: 'Image Gen', icon: '🎨' },
] as const

export function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [compactMode, setCompactMode] = useState(true)
  const [collapsedProviders, setCollapsedProviders] = useState<Set<string>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch user configuration from Convex
  const userConfig = useQuery(api.account.queries.getUserConfiguration)
  const updateUserConfig = useMutation(api.account.mutations.updateUserConfiguration)

  // Get current selected model and favorites from user config
  const selectedModel = (userConfig?.currentlySelectedModel as ModelId) || 'claude-4-sonnet'
  const favoriteModels = userConfig?.favoriteModels || []

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setActiveFilters(new Set())
        setShowFavoritesOnly(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Focus search input when dropdown opens
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const selectedModelData = models[selectedModel]

  const filteredModels = useMemo(() => {
    let filtered = Object.entries(models).filter(([, model]) => !model.disabled)

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(([, model]) => 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply capability filters
    if (activeFilters.size > 0) {
      filtered = filtered.filter(([, model]) => {
        if (!model.features) return false
        return Array.from(activeFilters).every(filter => 
          model.features?.includes(filter as any)
        )
      })
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(([modelId]) => favoriteModels.includes(modelId))
    }

    // Group by provider
    const grouped = filtered.reduce((acc, [modelId, model]) => {
      if (!acc[model.provider]) {
        acc[model.provider] = []
      }
      acc[model.provider].push([modelId, model])
      return acc
    }, {} as Record<string, typeof filtered>)

    return grouped
  }, [searchQuery, activeFilters, showFavoritesOnly, favoriteModels])

  // Separate favorites for the top section
  const favoriteModelsList = useMemo(() => {
    return Object.entries(models)
      .filter(([modelId]: [string, any]) => favoriteModels.includes(modelId))
      .filter(([, model]: [string, any]) => !model.disabled)
  }, [favoriteModels])

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'Anthropic':
        return 'from-orange-500 to-orange-600'
      case 'OpenAI':
      case 'Azure':
        return 'from-green-500 to-green-600'
      case 'Google':
        return 'from-blue-500 to-blue-600'
      case 'Groq':
        return 'from-purple-500 to-purple-600'
      case 'Fireworks.ai':
        return 'from-red-500 to-red-600'
      case 'OpenRouter':
        return 'from-gray-500 to-gray-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'Anthropic': return '🤖'
      case 'OpenAI': return '🟢'
      case 'Azure': return '☁️'
      case 'Google': return '🔵'
      case 'Groq': return '⚡'
      case 'Fireworks.ai': return '🔥'
      case 'OpenRouter': return '🔀'
      default: return '⚙️'
    }
  }

  const getCapabilityIcon = (feature: string) => {
    const capability = CAPABILITY_FILTERS.find(f => f.key === feature)
    return capability?.icon || '•'
  }

  const toggleFilter = (filterKey: string) => {
    const newFilters = new Set(activeFilters)
    if (newFilters.has(filterKey)) {
      newFilters.delete(filterKey)
    } else {
      newFilters.add(filterKey)
    }
    setActiveFilters(newFilters)
  }

  const toggleProvider = (provider: string) => {
    const newCollapsed = new Set(collapsedProviders)
    if (newCollapsed.has(provider)) {
      newCollapsed.delete(provider)
    } else {
      newCollapsed.add(provider)
    }
    setCollapsedProviders(newCollapsed)
  }

  const toggleFavorite = async (modelId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const newFavorites = favoriteModels.includes(modelId)
      ? favoriteModels.filter(id => id !== modelId)
      : [...favoriteModels, modelId]
    
    await updateUserConfig({
      configuration: {
        favoriteModels: newFavorites
      }
    })
  }

  const selectModel = async (modelId: string) => {
    await updateUserConfig({
      configuration: {
        currentlySelectedModel: modelId
      }
    })
    setIsOpen(false)
    setSearchQuery('')
    setActiveFilters(new Set())
    setShowFavoritesOnly(false)
  }

  const clearAllFilters = () => {
    setActiveFilters(new Set())
    setSearchQuery('')
    setShowFavoritesOnly(false)
  }

  const totalResults = Object.values(filteredModels).flat().length

  const renderCompactModelCard = (modelId: string, model: any, isInFavorites = false) => (
    <div
      key={modelId}
      onClick={() => selectModel(modelId)}
      className={`group relative p-2 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
        selectedModel === modelId 
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-md' 
          : 'border-border hover:border-blue-300 bg-card hover:bg-accent/50'
      }`}
      title={`${model.name} - ${model.shortDescription}${model.features ? '\n\nCapabilities: ' + model.features.map((f: string) => CAPABILITY_FILTERS.find(cap => cap.key === f)?.label || f).join(', ') : ''}`}
    >
      {/* Selection indicator */}
      {selectedModel === modelId && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Favorite button */}
      <button
        onClick={(e) => toggleFavorite(modelId, e)}
        className={`absolute top-1 right-1 p-0.5 rounded-full transition-colors z-10 ${
          favoriteModels.includes(modelId) 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
        }`}
        title={favoriteModels.includes(modelId) ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg className="w-3 h-3" fill={favoriteModels.includes(modelId) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Provider badge */}
      {!isInFavorites && (
        <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white bg-gradient-to-r ${getProviderColor(model.provider)} mb-1.5`}>
          <span className="mr-1 text-xs">{getProviderIcon(model.provider)}</span>
          <span className="hidden sm:inline text-xs">{model.provider}</span>
        </div>
      )}

      {/* Model name */}
      <h4 className="font-semibold text-xs text-foreground mb-1.5 pr-4 truncate">
        {model.name}
      </h4>

      {/* BYOK indicator */}
      {'byok' in model && model.byok === 'required' && (
        <div className="inline-flex items-center px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded mb-1">
          🔑
        </div>
      )}

      {/* Capabilities - condensed to icons only */}
      {model.features && model.features.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {model.features.slice(0, 6).map((feature: string, index: number) => (
            <span
              key={index}
              className="text-xs bg-muted/60 text-muted-foreground w-4 h-4 rounded flex items-center justify-center"
              title={CAPABILITY_FILTERS.find(f => f.key === feature)?.label || feature}
            >
              {getCapabilityIcon(feature)}
            </span>
          ))}
          {model.features.length > 6 && (
            <span className="text-xs bg-muted/60 text-muted-foreground w-4 h-4 rounded flex items-center justify-center text-xs" title={`${model.features.length - 6} more capabilities`}>
              +{model.features.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Hover tooltip for detailed info */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 min-w-64 max-w-80">
        <div className="font-medium mb-1">{model.name}</div>
        <div className="text-gray-300 mb-2">{model.shortDescription}</div>
        {model.features && model.features.length > 0 && (
          <div className="text-gray-400">
            <div className="font-medium mb-1">Capabilities:</div>
            <div className="flex flex-wrap gap-1">
              {model.features.map((feature: string, index: number) => {
                const capability = CAPABILITY_FILTERS.find(f => f.key === feature)
                return capability && (
                  <span key={index} className="text-xs bg-gray-800 px-1.5 py-0.5 rounded">
                    {capability.icon} {capability.label}
                  </span>
                )
              })}
            </div>
          </div>
        )}
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )

  const renderDetailedModelCard = (modelId: string, model: any, isInFavorites = false) => (
    <button
      key={modelId}
      onClick={() => selectModel(modelId)}
      className={`w-full text-left p-3 rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors relative ${
        selectedModel === modelId ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-foreground dark:text-foreground truncate">{model.name}</span>
            {'byok' in model && model.byok === 'required' && (
              <span className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded flex-shrink-0">
                BYOK
              </span>
            )}
            {!isInFavorites && (
              <span className={`px-2 py-0.5 rounded text-xs font-medium text-white bg-gradient-to-r ${getProviderColor(model.provider)}`}>
                <span className="mr-1">{getProviderIcon(model.provider)}</span>
                {model.provider}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2 line-clamp-2">{model.shortDescription}</p>
          {model.features && model.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {model.features.map((feature: string, index: number) => {
                const capability = CAPABILITY_FILTERS.find(f => f.key === feature)
                return capability && (
                  <span
                    key={index}
                    className="inline-flex items-center px-1.5 py-0.5 bg-accent dark:bg-accent text-accent-foreground dark:text-accent-foreground text-xs rounded"
                  >
                    <span className="mr-1">{capability.icon}</span>
                    {capability.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <button
            onClick={(e) => toggleFavorite(modelId, e)}
            className={`p-1 rounded-full transition-colors hover:bg-accent dark:hover:bg-accent ${
              favoriteModels.includes(modelId) 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title={favoriteModels.includes(modelId) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className="w-4 h-4" fill={favoriteModels.includes(modelId) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          {selectedModel === modelId && (
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </button>
  )

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-background dark:bg-background border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors text-sm"
      >
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white bg-gradient-to-r ${getProviderColor(selectedModelData.provider)}`}>
            <span className="mr-1">{getProviderIcon(selectedModelData.provider)}</span>
            {selectedModelData.provider}
          </span>
          <span className="font-medium text-foreground dark:text-foreground">{selectedModelData.name}</span>
          {favoriteModels.includes(selectedModel) && (
            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full sm:w-[520px] bg-background dark:bg-background border border-border dark:border-border rounded-lg shadow-lg z-50 flex flex-col max-h-[600px]">
          {/* Header with search and filters */}
          <div className="p-3 sm:p-4 border-b border-border dark:border-border flex-shrink-0">
            {/* Search Input */}
            <div className="relative mb-3">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 min-w-0">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* View Toggle */}
                <div className="flex bg-muted dark:bg-muted rounded-lg p-1 flex-shrink-0">
                  <button
                    onClick={() => setCompactMode(true)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${
                      compactMode
                        ? 'bg-background dark:bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="Grid view"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCompactMode(false)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-all ${
                      !compactMode
                        ? 'bg-background dark:bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="List view"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-3">
              {(activeFilters.size > 0 || searchQuery || showFavoritesOnly) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Capability Filters */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    showFavoritesOnly
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                      : 'bg-muted dark:bg-muted text-muted-foreground hover:bg-accent dark:hover:bg-accent border border-transparent'
                  }`}
                >
                  <span className="mr-1">❤️</span>
                  Favorites
                </button>
                {CAPABILITY_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => toggleFilter(filter.key)}
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      activeFilters.has(filter.key)
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-muted dark:bg-muted text-muted-foreground hover:bg-accent dark:hover:bg-accent border border-transparent'
                    }`}
                  >
                    <span className="mr-1">{filter.icon}</span>
                    <span className="hidden sm:inline">{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div className="mt-2 text-xs text-muted-foreground">
              {showFavoritesOnly ? `${favoriteModelsList.length} favorite${favoriteModelsList.length !== 1 ? 's' : ''}` : 
               `${totalResults} model${totalResults !== 1 ? 's' : ''} found`}
            </div>
          </div>

          {/* Models List with ScrollArea */}
          <ScrollArea className="h-[400px]">
            {showFavoritesOnly ? (
              // Show favorites only
              favoriteModelsList.length > 0 ? (
                <div className="p-3">
                  {compactMode ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {favoriteModelsList.map(([modelId, model]) => 
                        renderCompactModelCard(modelId, model, true)
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {favoriteModelsList.map(([modelId, model]) => 
                        renderDetailedModelCard(modelId, model, true)
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="text-2xl mb-2">❤️</div>
                  <div className="text-sm">No favorite models yet</div>
                  <div className="text-xs mt-1">Click the heart icon on any model to add it to favorites</div>
                </div>
              )
            ) : (
              // Show all models grouped by provider
              Object.entries(filteredModels).map(([provider, providerModels], providerIndex) => (
                <div key={provider}>
                  {/* Collapsible Provider Header */}
                  <button
                    onClick={() => toggleProvider(provider)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getProviderColor(provider)}`} />
                      <span className="font-medium text-sm">{provider}</span>
                      <span className="text-xs text-muted-foreground">
                        ({providerModels.length} model{providerModels.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        collapsedProviders.has(provider) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Provider Models */}
                  {!collapsedProviders.has(provider) && (
                    <div className="p-3">
                      {compactMode ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {providerModels.map(([modelId, model]) => 
                            renderCompactModelCard(modelId, model)
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {providerModels.map(([modelId, model]) => 
                            renderDetailedModelCard(modelId, model)
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Divider between providers */}
                  {providerIndex < Object.keys(filteredModels).length - 1 && (
                    <div className="border-b border-border/50 dark:border-border/50" />
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}