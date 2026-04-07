const getToken = () => localStorage.getItem('vestora_token')

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('vestora_token')
    window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  const json = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed with status ${res.status}`)
  }

  return json.data
}

const buildHeaders = (includeContentType = true) => {
  const headers = {}
  const token = getToken()

  if (includeContentType) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

const api = {
  async get(path) {
    const res = await fetch(path, {
      method: 'GET',
      headers: buildHeaders(),
    })
    return handleResponse(res)
  },

  async post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  },

  async put(path, body) {
    const res = await fetch(path, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    })
    return handleResponse(res)
  },

  async delete(path) {
    const res = await fetch(path, {
      method: 'DELETE',
      headers: buildHeaders(),
    })
    return handleResponse(res)
  },

  async upload(path, formData) {
    const res = await fetch(path, {
      method: 'POST',
      headers: buildHeaders(false),
      body: formData,
    })
    return handleResponse(res)
  },
}

export default api
