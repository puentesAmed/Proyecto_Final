import { api } from '@/lib/api.js'

export const getAccounts=async()=> (await api.get('/accounts')).data

export const createAccount=async(payload)=> (await api.post('/accounts',payload)).data

//export const updateAccount=async(id,payload)=> (await api.put(`/accounts/${id}`,payload)).data

export const updateAccount = async (id, payload) => (await api.patch(`/accounts/${id}`, payload)).data;

//export const update = (id, payload) => api.patch(`/accounts/${id}`, payload).then(r => r.data);
export const deleteAccount=async(id)=> (await api.delete(`/accounts/${id}`)).data