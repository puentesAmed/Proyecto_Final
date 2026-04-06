import { api } from "../lib/api";

export const createForecast = async (data) => (await api.post("/cashflows", data)).data;
export const getCalendar = async ({start, end}) => {
    const res = await api.get("/cashflows/calendar", { params: {start, end} })
    return res.data.map(f => ({
        id: f._id,
        title: f.title,
        start: f.start,
        backgroundColor: f.backgroundColor, borderColor: f.borderColor, extendedProps: f.extendedProps
    }))
}  

export const clearAllCashflows = async () => {
  const res = await api.delete('/cashflows/all')
  return res.data
}