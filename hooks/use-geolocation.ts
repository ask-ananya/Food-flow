import { useState, useEffect } from 'react'

interface GeolocationState {
  location: {
    latitude: number
    longitude: number
  } | null
  error: GeolocationPositionError | null
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: {
          code: 0,
          message: 'Geolocation is not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        },
      }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
        })
      },
      (error) => {
        setState((prev) => ({
          ...prev,
          error,
        }))
      }
    )
  }, [])

  return state
}