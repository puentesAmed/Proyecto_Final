import { useSearchParams } from 'react-router-dom'
export function useUrlState(initial){
  const [sp, setSp] = useSearchParams(initial)
  const set = (patch)=>{ const next=new URLSearchParams(sp); Object.entries(patch).forEach(([k,v])=> v==null? next.delete(k):next.set(k,String(v))); setSp(next,{replace:true}) }
  return [Object.fromEntries(sp.entries()), set]
}
