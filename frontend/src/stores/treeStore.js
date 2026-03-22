import { create } from 'zustand'
import api from '../utils/api'
import toast from 'react-hot-toast'

export const useTreeStore = create((set, get) => ({
  persons: [],
  relations: [],
  loading: false,
  selectedPerson: null,

  fetchTree: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/api/persons/tree')
      set({ persons: data.persons, relations: data.relations, loading: false })
    } catch (e) {
      set({ loading: false })
      toast.error('Failed to load tree')
    }
  },

  addPerson: async (personData) => {
    try {
      const { data } = await api.post('/api/persons/', personData)
      set((s) => ({ persons: [...s.persons, data] }))
      toast.success(`${data.full_name} added!`)
      return data
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to add person')
      return null
    }
  },

  updatePerson: async (id, personData) => {
    try {
      const { data } = await api.put(`/api/persons/${id}`, personData)
      set((s) => ({ persons: s.persons.map(p => p.id === id ? data : p) }))
      toast.success('Person updated!')
      return data
    } catch (e) {
      toast.error('Failed to update person')
      return null
    }
  },

  deletePerson: async (id) => {
    try {
      await api.delete(`/api/persons/${id}`)
      set((s) => ({
        persons: s.persons.filter(p => p.id !== id),
        relations: s.relations.filter(r =>
          r.parent_id !== id && r.child_id !== id &&
          r.person_a_id !== id && r.person_b_id !== id
        ),
        selectedPerson: s.selectedPerson?.id === id ? null : s.selectedPerson,
      }))
      toast.success('Person removed')
    } catch (e) {
      toast.error('Failed to delete person')
    }
  },

  addRelation: async (relationData) => {
    try {
      const { data } = await api.post('/api/persons/relations', relationData)
      set((s) => ({ relations: [...s.relations, data] }))
      toast.success('Relation added!')
      return data
    } catch (e) {
      toast.error('Failed to add relation')
      return null
    }
  },

  deleteRelation: async (id) => {
    try {
      await api.delete(`/api/persons/relations/${id}`)
      set((s) => ({ relations: s.relations.filter(r => r.id !== id) }))
      toast.success('Relation removed')
    } catch (e) {
      toast.error('Failed to remove relation')
    }
  },

  savePositions: async (positions) => {
    try {
      await api.post('/api/persons/positions', positions)
    } catch (e) {
      // silent
    }
  },

  importVCF: async (file) => {
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/api/persons/import/vcf', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      set((s) => ({ persons: [...s.persons, ...data] }))
      toast.success(`Imported ${data.length} contact(s)!`)
      return data
    } catch (e) {
      toast.error('Import failed')
      return []
    }
  },

  exportVCF: async () => {
    try {
      const res = await api.get('/api/persons/export/vcf', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'family_tree.vcf'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Exported!')
    } catch (e) {
      toast.error('Export failed')
    }
  },

  setSelectedPerson: (person) => set({ selectedPerson: person }),
}))
