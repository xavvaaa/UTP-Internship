/**
 * Admin Management Service
 * Handles API calls for user management, settings, categories, and inventory
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

/**
 * USER MANAGEMENT
 */

export async function getAllUsers(token) {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to fetch users' }
    }
    return { ok: true, users: data.users }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function createUser(userData, token) {
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to create user' }
    }
    return { ok: true, user: data.user }
  } catch (error) {
    console.error('Error creating user:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function updateUser(userId, userData, token) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to update user' }
    }
    return { ok: true, user: data.user }
  } catch (error) {
    console.error('Error updating user:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function deleteUser(userId, token) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to delete user' }
    }
    return { ok: true, message: data.message }
  } catch (error) {
    console.error('Error deleting user:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function updateUserRole(userId, role, token) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to update role' }
    }
    return { ok: true, user: data.user }
  } catch (error) {
    console.error('Error updating role:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function toggleUserStatus(userId, active, token) {
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}/activate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ active }),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to update status' }
    }
    return { ok: true, user: data.user }
  } catch (error) {
    console.error('Error toggling status:', error)
    return { ok: false, error: 'Network error' }
  }
}

/**
 * MENU CATEGORIES
 */

export async function getCategories(token) {
  try {
    const response = await fetch(`${API_URL}/admin/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to fetch categories' }
    }
    return { ok: true, categories: data.categories }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function createCategory(categoryData, token) {
  try {
    const response = await fetch(`${API_URL}/admin/categories`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to create category' }
    }
    return { ok: true, category: data.category }
  } catch (error) {
    console.error('Error creating category:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function updateCategory(categoryId, categoryData, token) {
  try {
    const response = await fetch(`${API_URL}/admin/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to update category' }
    }
    return { ok: true, category: data.category }
  } catch (error) {
    console.error('Error updating category:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function deleteCategory(categoryId, token) {
  try {
    const response = await fetch(`${API_URL}/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to delete category' }
    }
    return { ok: true, message: data.message }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { ok: false, error: 'Network error' }
  }
}

/**
 * INVENTORY SETTINGS
 */

export async function getInventorySettings(token) {
  try {
    const response = await fetch(`${API_URL}/admin/inventory`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to fetch inventory' }
    }
    return { ok: true, items: data.items }
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function createInventoryItem(itemData, token) {
  try {
    const response = await fetch(`${API_URL}/admin/inventory`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to create inventory item' }
    }
    return { ok: true, item: data.item }
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function updateInventoryItem(itemId, itemData, token) {
  try {
    const response = await fetch(`${API_URL}/admin/inventory/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to update inventory item' }
    }
    return { ok: true, item: data.item }
  } catch (error) {
    console.error('Error updating inventory item:', error)
    return { ok: false, error: 'Network error' }
  }
}

export async function deleteInventoryItem(itemId, token) {
  try {
    const response = await fetch(`${API_URL}/admin/inventory/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    const data = await response.json()
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to delete inventory item' }
    }
    return { ok: true, message: data.message }
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return { ok: false, error: 'Network error' }
  }
}
