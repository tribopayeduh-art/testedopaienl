// Excel-safe CSV export shared by the two workspaces.
export function buildReportCsv(headers:string[],rows:unknown[][]){
 const cell=(v:unknown)=>{let s=String(v??'');if(typeof v==='string'&&/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 return '\uFEFF'+[headers,...rows].map(row=>row.map(cell).join(';')).join('\r\n');
}
export function downloadReportCsv(filename:string,headers:string[],rows:unknown[][]){
 const csv=buildReportCsv(headers,rows);
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
 const link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
