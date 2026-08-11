function r(e){const t=e[e.length-1];if(!t||t.role!=="user")return"";const n=t.content??t.text??"";return typeof n=="string"?n.trim():""}export{r as g};
