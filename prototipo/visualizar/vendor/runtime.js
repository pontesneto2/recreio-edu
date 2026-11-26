
window.DCLogic = class { constructor(){ this.props = {}; this.state = {}; } setState(p){ Object.assign(this.state, typeof p==='function'?p(this.state):p); window.__paint && window.__paint(); } };
function get(scope, p){ return p.split('.').reduce((o,k)=> o==null?undefined:o[k], scope); }
function interp(str, scope){
  const m = /^\s*\{\{\s*([\w.]+)\s*\}\}\s*$/.exec(str);
  if (m) return get(scope, m[1]);
  return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_,p)=>{ const v=get(scope,p); return v==null?'':String(v); });
}
function camel(s){ return s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()); }
function styleObj(s){ const o={}; s.split(';').forEach(d=>{ const i=d.indexOf(':'); if(i<0) return; const k=d.slice(0,i).trim(); const v=d.slice(i+1).trim(); if(!k) return; o[k.startsWith('--')?k:camel(k)]=v; }); return o; }
const ATTR = { onclick:'onClick', onchange:'onChange', class:'className', for:'htmlFor', tabindex:'tabIndex', colspan:'colSpan', rowspan:'rowSpan', readonly:'readOnly', maxlength:'maxLength', autocomplete:'autoComplete' };
function conv(node, scope, key){
  const h = React.createElement;
  if (node.nodeType === 3) { const t = node.nodeValue; return t.includes('{{') ? interp(t, scope) : t; }
  if (node.nodeType !== 1) return null;
  const tag = node.tagName.toLowerCase();
  const kids = (sc)=> Array.from(node.childNodes).map((c,i)=>conv(c, sc, i)).filter(x=>x!==null && x!=='');
  if (tag === 'helmet' || tag === 'script') return null;
  if (tag === 'sc-for') { const list = interp(node.getAttribute('list'), scope) || []; const as = node.getAttribute('as');
    return h(React.Fragment, {key}, list.map((it,i)=> h(React.Fragment,{key:i}, kids(Object.assign({}, scope, {[as]: it}))))); }
  if (tag === 'sc-if') { const v = interp(node.getAttribute('value'), scope); return v ? h(React.Fragment,{key}, kids(scope)) : null; }
  const props = { key };
  for (const a of Array.from(node.attributes)) {
    if (a.name === 'component-from-global-scope') continue;
    let v = a.value.includes('{{') ? interp(a.value, scope) : a.value;
    if (a.name === 'style') { props.style = styleObj(String(v)); continue; }
    const name = ATTR[a.name] || (a.name.startsWith('aria-') || a.name.startsWith('data-') ? a.name : (tag==='x-import'? camel(a.name) : a.name));
    if (tag === 'x-import' && v === '') v = true;
    props[name] = v;
  }
  if (tag === 'x-import') {
    const cname = node.getAttribute('component-from-global-scope');
    const C = cname.split('.').reduce((o,k)=>o&&o[k], window);
    if (!C) throw new Error('componente ausente ' + cname);
    const ch = kids(scope);
    return h(C, props, ...(ch.length ? ch : []));
  }
  const ch = kids(scope);
  const VOID = ['img','input','br','hr','meta','link','source'];
  return h(tag, props, ...(VOID.includes(tag) ? [] : ch));
}
window.__render = function(){
  const tpl = document.getElementById('dc-src');
  const root = tpl.content.querySelector('x-dc');
  const C = eval('(' + document.getElementById('dc-js').textContent.replace(/^\s*class Component/, 'class') + ')');
  const inst = new C(); const rr = ReactDOM.createRoot(document.getElementById('app'));
  window.__paint = () => { const vals = inst.renderVals();
    const out = Array.from(root.childNodes).map((c,i)=>conv(c, vals, i)).filter(x=>x!==null && (typeof x!=='string' || x.trim()));
    rr.render(React.createElement(React.Fragment, null, ...out)); };
  window.__paint();
};

document.addEventListener('DOMContentLoaded', () => window.__render());
