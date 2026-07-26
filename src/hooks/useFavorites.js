import { useState, useEffect, useCallback } from 'react'
import { getFavorites, addFavorite, removeFavorite } from '../services/favoritesService'

/**
 * Loads the signed-in user's favorited module keys and exposes an optimistic
 * toggle. `favorites` is a Set of module keys; `loaded` guards the initial
 * render so the Favorites section doesn't flash empty before the fetch returns.
 *
 * Writes are optimistic and fire-and-forget (the app's house style) — a failed
 * DB write is reverted so the UI never lies about what's persisted.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(() => new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    getFavorites()
      .then((keys) => { if (active) setFavorites(new Set(keys)) })
      .catch(() => { /* not signed in / transient — treat as no favorites */ })
      .finally(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [])

  const toggle = useCallback((key) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      const wasFavorite = next.has(key)
      if (wasFavorite) next.delete(key)
      else next.add(key)

      const write = wasFavorite ? removeFavorite(key) : addFavorite(key)
      write.catch(() => {
        // Revert the optimistic change if the DB write failed.
        setFavorites((cur) => {
          const reverted = new Set(cur)
          if (wasFavorite) reverted.add(key)
          else reverted.delete(key)
          return reverted
        })
      })
      return next
    })
  }, [])

  return { favorites, toggle, loaded }
}
