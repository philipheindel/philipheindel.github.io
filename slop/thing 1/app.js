/* app.js
   Core logic for the Tkinter GUI Builder.
   Uses interact.js for resizing helpers; custom drag/drop + snapping + code generation.
*/

const WIDGET_TEMPLATES = {
  frame: () => createDom('div', { className: 'widget frame-like' }, ['Frame']),
  labelframe: () => createDom('fieldset', { className: 'widget labelframe-like' }, ['LabelFrame']),
  label: () => createDom('div', { className: 'widget label-like' }, ['Label']),
  button: () => {
    const w = createDom('div', { className: 'widget button-like' });
    const btn = document.createElement('button'); btn.innerText = 'Button';
    w.appendChild(btn); return w;
  },
  checkbutton: () => createDom('label', { className: 'widget checkbutton-like' }, [createDom('input',{type:'checkbox'}), 'Check']),
  radiobutton: () => createDom('label', { className: 'widget radiobutton-like' }, [createDom('input',{type:'radio'}), 'Radio']),
  entry: () => createDom('div', { className: 'widget entry-like' }, [createDom('input',{type:'text', placeholder:'Entry'})]),
  combobox: () => createDom('div', { className: 'widget combobox-like' }, [createDom('select', {}, [createDom('option', {}, ['Item 1'])])]),
  listbox: () => createDom('div', { className: 'widget listbox-like' }, [createDom('select', { size:4 }, [createDom('option', {}, ['Item A']), createDom('option', {}, ['Item B'])])]),
  scrollbar: () => createDom('div', { className: 'widget scrollbar-like' }, ['||']),
  text: () => createDom('div', { className: 'widget text-like' }, [createDom('textarea', {}, [''])]),
  scale: () => createDom('input', { className: 'widget scale-like', type:'range', min:0, max:100, value:50 }),
  spinbox: () => createDom('input', { className: 'widget spinbox-like', type:'number', min:0, max:10, value:0 }),
  progressbar: () => createDom('div', { className: 'widget progressbar-like' }, []),
  separator: () => createDom('div', { className: 'widget separator-like' }, []),
  panedwindow: () => createDom('div', { className: 'widget panedwindow-like' }, ['Pane']),
  notebook: () => createDom('div', { className: 'widget notebook-like' }, ['Notebook']),
  treeview: () => createDom('div', { className: 'widget treeview-like' }, ['Treeview']),
};

function createDom(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  if (attrs.className) el.className = attrs.className;
  if (attrs.type) el.type = attrs.type;
  if (attrs.placeholder) el.placeholder = attrs.placeholder;
  if (attrs.size) el.size = attrs.size;
  if (attrs.min !== undefined) el.min = attrs.min;
  if (attrs.max !== undefined) el.max = attrs.max;
  if (attrs.value !== undefined) el.value = attrs.value;
  for (const k in attrs) {
    if (['className','type','placeholder','size','min','max','value'].includes(k)) continue;
    el.setAttribute(k, attrs[k]);
  }
  if (!Array.isArray(children)) children = [children];
  children.forEach(c => {
    if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else if (c instanceof Node) el.appendChild(c);
  });
  return el;
}

/* App State */
const preview = document.getElementById('preview');
const previewShell = document.getElementById('preview-resizer');
const props = {
  container: document.getElementById('props-container'),
  title: document.getElementById('props-title'),
  type: document.getElementById('prop-type'),
  inputs: {
    text: document.getElementById('prop-text'),
    x: document.getElementById('prop-x'),
    y: document.getElementById('prop-y'),
    width: document.getElementById('prop-width'),
    height: document.getElementById('prop-height'),
    fontFamily: document.getElementById('prop-font-family'),
    fontSize: document.getElementById('prop-font-size'),
    fontBold: document.getElementById('prop-font-bold'),
    fontItalic: document.getElementById('prop-font-italic'),
    bg: document.getElementById('prop-bg'),
    fg: document.getElementById('prop-fg'),
    advanced: document.getElementById('prop-advanced')
  },
  special: document.getElementById('special-props'),
  noSelection: document.getElementById('no-selection')
};
const generatedCode = document.getElementById('generated-code');
const toggleCodeBtn = document.getElementById('toggle-code');
const codePanel = document.getElementById('code-panel');
const snapInput = document.getElementById('snapThreshold');

let selected = new Set();
let widgets = []; // {id, el, type, props}
let nextId = 1;
let snapGuides = [];
let marquee = null;
let isCtrl = false;
let snapThreshold = parseInt(snapInput.value,10) || 8;

// set some defaults
preview.style.width = '640px';
preview.style.height = '360px';

function uid(){return 'w' + (nextId++)}

/* ----------------------------
   Drag from toolbox -> preview
   ---------------------------- */
document.querySelectorAll('#tools .tool').forEach(tool => {
  tool.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/widget', tool.dataset.widget);
    // small drag image to show name
    const img = document.createElement('div'); img.style.padding='4px 8px'; img.style.background='#222'; img.style.color='#fff';
    img.innerText = tool.innerText;
    document.body.appendChild(img);
    e.dataTransfer.setDragImage(img,10,10);
    setTimeout(()=>document.body.removeChild(img),0);
  });
});

preview.addEventListener('dragover', e => {
  e.preventDefault();
});
preview.addEventListener('drop', e => {
  e.preventDefault();
  const widgetType = e.dataTransfer.getData('text/widget');
  if (!widgetType || !WIDGET_TEMPLATES[widgetType]) return;
  const rect = preview.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const w = 120, h = 30;
  const el = WIDGET_TEMPLATES[widgetType]();
  const id = uid();
  el.dataset.id = id;
  el.dataset.type = widgetType;
  el.style.left = (x - w/2) + 'px';
  el.style.top = (y - h/2) + 'px';
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.classList.add('widget');
  preview.appendChild(el);

  widgets.push({id, el, type:widgetType, props:{text:extractText(el)}});

  makeWidgetInteractive(el);
  selectOnly(el);
  updateCode();
});

/* ----------------------------
   Widget creation helpers
   ---------------------------- */
function extractText(el){
  // heuristic
  if (el.querySelector('button')) return el.querySelector('button').innerText;
  if (el.querySelector('input[type=text]')) return el.querySelector('input[type=text]').value || '';
  if (el.querySelector('textarea')) return el.querySelector('textarea').value || '';
  if (el.tagName.toLowerCase() === 'label') return el.innerText || '';
  return el.innerText || '';
}

function makeWidgetInteractive(el){
  // attach event handlers for select, drag, resize handles, and keyboard
  el.addEventListener('mousedown', widgetMouseDown);
  el.addEventListener('click', widgetClick);

  // add resize handles visually for users (interact will handle pointer). We'll use interact.js
  interact(el).draggable({
    listeners: {start(event){ beginDragWidget(event); }, move(event){ dragMove(event); }, end(){ clearSnapGuides(); }},
    modifiers: [
      interact.modifiers.restrictRect({ restriction: preview, endOnly: true })
    ],
    inertia: true
  }).resizable({
    edges: { left: true, right: true, bottom: true, top: true },
    listeners: {
      move (event) {
        const target = event.target;
        let x = (parseFloat(target.getAttribute('data-x')) || 0);
        let y = (parseFloat(target.getAttribute('data-y')) || 0);

        // update the element's style
        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';

        // translate when resizing from top or left edges
        x += event.deltaRect.left;
        y += event.deltaRect.top;

        target.style.transform = 'translate(' + x + 'px,' + y + 'px)';

        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
      },
      end () {
        // finalize: apply transforms into left/top and reset transforms
        finalizeTransform(event.target);
        updateCode();
      }
    },
    modifiers: [
      interact.modifiers.restrictSize({ min: { width: 20, height: 20 }, max: { width: preview.clientWidth, height: preview.clientHeight }})
    ],
    inertia: true
  });

  // ensure it has no transform initially
  el.style.transform = 'translate(0px,0px)';
  el.setAttribute('data-x','0'); el.setAttribute('data-y','0');

  // click selection handled separately
}

function finalizeTransform(target){
  // apply translate offsets into left/top
  const tx = parseFloat(target.getAttribute('data-x')) || 0;
  const ty = parseFloat(target.getAttribute('data-y')) || 0;
  if (tx || ty) {
    const left = parseFloat(target.style.left || 0);
    const top = parseFloat(target.style.top || 0);
    target.style.left = (left + tx) + 'px';
    target.style.top = (top + ty) + 'px';
    target.style.transform = 'translate(0px,0px)';
    target.setAttribute('data-x','0'); target.setAttribute('data-y','0');
  }
}

/* ----------------------------
   Selection handling
   ---------------------------- */
function widgetClick(e){
  e.stopPropagation(); // avoid preview deselect
  if (e.ctrlKey || isCtrl) {
    toggleSelect(this);
  } else {
    selectOnly(this);
  }
}

function widgetMouseDown(e){
  // focus preview so keyboard works
  preview.focus();
}

function selectOnly(el){
  clearSelection();
  addToSelection(el);
  showPropsFor(el);
}

function addToSelection(el){
  el.classList.add('selected');
  selected.add(el);
}

function removeFromSelection(el){
  el.classList.remove('selected');
  selected.delete(el);
}

function toggleSelect(el){
  if (selected.has(el)) removeFromSelection(el);
  else addToSelection(el);
  // if only one selected, show its props
  if (selected.size === 1) {
    showPropsFor([...selected][0]);
  } else {
    showPropsForMultiple();
  }
}

function clearSelection(){
  for (let el of selected) el.classList.remove('selected');
  selected.clear();
  hideProps();
}

document.addEventListener('click', e=>{
  if (!preview.contains(e.target)) {
    // click outside preview deselects
    // but allow clicking properties/toolbar/toolbox
    if (!document.getElementById('properties').contains(e.target) && !document.getElementById('tools').contains(e.target)) {
      clearSelection();
      updateCode();
    }
  }
});

function showPropsFor(el){
  props.noSelection.style.display = 'none';
  props.container.style.display = 'block';
  props.title.innerText = `Selected: ${el.dataset.type} (${el.dataset.id})`;
  props.type.innerText = el.dataset.type;
  // fill general props
  const rect = el.getBoundingClientRect(), pRect = preview.getBoundingClientRect();
  const x = parseFloat(el.style.left || 0), y = parseFloat(el.style.top || 0);
  const w = el.offsetWidth, h = el.offsetHeight;
  props.inputs.x.value = Math.round(x);
  props.inputs.y.value = Math.round(y);
  props.inputs.width.value = Math.round(w);
  props.inputs.height.value = Math.round(h);
  props.inputs.text.value = extractText(el);
  props.inputs.fontFamily.value = window.getComputedStyle(el).fontFamily || '';
  props.inputs.fontSize.value = parseInt(window.getComputedStyle(el).fontSize) || '';
  props.inputs.fontBold.checked = (window.getComputedStyle(el).fontWeight === '700' || parseInt(window.getComputedStyle(el).fontWeight) >= 700);
  props.inputs.fontItalic.checked = window.getComputedStyle(el).fontStyle === 'italic';
  const bg = rgbToHex(window.getComputedStyle(el).backgroundColor || '');
  const fg = rgbToHex(window.getComputedStyle(el).color || '');
  props.inputs.bg.value = bg || '#ffffff';
  props.inputs.fg.value = fg || '#000000';
  props.inputs.advanced.value = JSON.stringify(el._advanced || {}, null, 2);

  // build special props area
  buildSpecialProps(el);
}

function showPropsForMultiple(){
  props.noSelection.style.display = 'none';
  props.container.style.display = 'block';
  props.title.innerText = `Selected: ${selected.size} elements`;
  props.type.innerText = 'MULTI';
  // clear some inputs or show aggregate values
  props.inputs.text.value = '';
  props.inputs.x.value = '';
  props.inputs.y.value = '';
  props.inputs.width.value = '';
  props.inputs.height.value = '';
  props.inputs.advanced.value = '';
  props.special.innerHTML = '';
}

function hideProps(){
  props.noSelection.style.display = 'block';
  props.container.style.display = 'none';
  props.title.innerText = '';
}

/* ----------------------------
   Keyboard movement & preview resize finalize
   ---------------------------- */
preview.addEventListener('keydown', e=>{
  // arrow keys move selected widgets. If multiple, move all.
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const delta = (e.shiftKey ? 10 : 1);
    let dx = 0, dy = 0;
    if (e.key === 'ArrowUp') dy = -delta;
    if (e.key === 'ArrowDown') dy = delta;
    if (e.key === 'ArrowLeft') dx = -delta;
    if (e.key === 'ArrowRight') dx = delta;
    for (let el of selected) {
      const left = Math.max(0, parseFloat(el.style.left || 0) + dx);
      const top = Math.max(0, parseFloat(el.style.top || 0) + dy);
      el.style.left = left + 'px';
      el.style.top = top + 'px';
    }
    updateCode();
  }
});

// preview resizer - use native resize of container, but watch size changes to update code
new ResizeObserver(()=> {
  updateCode();
}).observe(preview);

/* ----------------------------
   Drag move: custom snapping to other elements with guides
   ---------------------------- */
let dragState = {el:null, startX:0, startY:0, origLeft:0, origTop:0};
function beginDragWidget(event){
  const target = event.target;
  dragState.el = target;
  dragState.startX = event.client.x || event.client.x;
  dragState.startY = event.client.y || event.client.y;
  dragState.origLeft = parseFloat(target.style.left || 0);
  dragState.origTop = parseFloat(target.style.top || 0);
  // if this element not selected, and ctrl not pressed, select only it
  if (!selected.has(target) && !event.event.ctrlKey) {
    selectOnly(target);
  }
}

function dragMove(event){
  // If multiple selected, drag all by same delta
  const dx = event.dx;
  const dy = event.dy;
  if (selected.size > 1 && selected.has(dragState.el)) {
    for (let el of selected) {
      const left = Math.max(0, parseFloat(el.style.left || 0) + dx);
      const top = Math.max(0, parseFloat(el.style.top || 0) + dy);
      el.style.left = left + 'px';
      el.style.top = top + 'px';
    }
    // show snap guides relative to first element only
    const primary = dragState.el;
    computeSnapping(primary);
  } else {
    const el = dragState.el;
    if (!el) return;
    let left = Math.max(0, parseFloat(el.style.left || 0) + dx);
    let top = Math.max(0, parseFloat(el.style.top || 0) + dy);

    // try snapping (but keyboard movement does not call this path)
    const snapped = trySnap(el, left, top);
    if (snapped) { left = snapped.x; top = snapped.y;}
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }
  updateCode();
}

/* Compute and draw snapping lines for the element against others */
function computeSnapping(el){
  const others = Array.from(preview.querySelectorAll('.widget')).filter(w=>w!==el);
  const rectA = el.getBoundingClientRect();
  const boundsA = relativeRect(el);
  clearSnapGuides();
  const px = preview.getBoundingClientRect().left;
  const py = preview.getBoundingClientRect().top;
  // check each other element edges/centers
  for (let b of others){
    const boundsB = relativeRect(b);
    const candidates = [
      {ax:boundsA.left, ay:boundsA.top, bx:boundsB.left, by:boundsB.top, orient:'v'},
      {ax:boundsA.left, ay:boundsA.top, bx:boundsB.right, by:boundsB.top, orient:'v'},
      {ax:boundsA.right, ay:boundsA.top, bx:boundsB.left, by:boundsB.top, orient:'v'},
      {ax:boundsA.centerX, ay:boundsA.centerY, bx:boundsB.centerX, by:boundsB.centerY, orient:'both'}
    ];
  }
}

/* Try snapping to nearby edges/centers; returns snapped coords or null */
function trySnap(el, left, top){
  const TH = snapThreshold;
  const w = el.offsetWidth, h = el.offsetHeight;
  const a = {left:left, right:left + w, top:top, bottom:top + h, centerX:left + w/2, centerY: top + h/2};
  const others = Array.from(preview.querySelectorAll('.widget')).filter(wg=>wg!==el);
  let snapX = null, snapY = null;
  clearSnapGuides();
  for (let o of others){
    const ox = parseFloat(o.style.left || 0), oy = parseFloat(o.style.top || 0);
    const ow = o.offsetWidth, oh = o.offsetHeight;
    const b = {left:ox, right:ox+ow, top:oy, bottom:oy+oh, centerX:ox+ow/2, centerY:oy+oh/2};
    // horizontal edges / centers
    [['left','left'], ['left','right'], ['right','left'], ['right','right'], ['centerX','centerX']].forEach(pair=>{
      const diff = a[pair[0]] - b[pair[1]];
      if (Math.abs(diff) <= TH) {
        // snap on X (left anchored)
        snapX = b[pair[1]];
        drawSnapLine('v', b[pair[1]]);
      }
    });
    // vertical edges / centers
    [['top','top'], ['top','bottom'], ['bottom','top'], ['bottom','bottom'], ['centerY','centerY']].forEach(pair=>{
      const diff = a[pair[0]] - b[pair[1]];
      if (Math.abs(diff) <= TH) {
        snapY = b[pair[1]];
        drawSnapLine('h', b[pair[1]]);
      }
    });
  }
  const finalX = (snapX !== null) ? (snapX) : a.left;
  const finalY = (snapY !== null) ? (snapY) : a.top;
  return {x: finalX, y: finalY};
}

function drawSnapLine(orient, pos){
  // orient 'v' = vertical line at x=pos; 'h' = horizontal line at y=pos
  const r = preview.getBoundingClientRect();
  const line = document.createElement('div');
  line.className = 'snap-line';
  if (orient === 'v') {
    line.style.left = pos + 'px';
    line.style.top = '0px';
    line.style.width = '2px';
    line.style.height = preview.clientHeight + 'px';
  } else {
    line.style.top = pos + 'px';
    line.style.left = '0px';
    line.style.height = '2px';
    line.style.width = preview.clientWidth + 'px';
  }
  preview.appendChild(line);
  snapGuides.push(line);
}

function clearSnapGuides(){
  snapGuides.forEach(g=>g.remove());
  snapGuides = [];
}

/* ----------------------------
   Helper: relativeRect (to preview coords)
   ---------------------------- */
function relativeRect(el){
  const left = parseFloat(el.style.left || 0);
  const top = parseFloat(el.style.top || 0);
  const w = el.offsetWidth, h = el.offsetHeight;
  return { left, top, right: left + w, bottom: top + h, centerX: left + w/2, centerY: top + h/2 };
}

/* ----------------------------
   Marquee selection
   ---------------------------- */
preview.addEventListener('mousedown', e=>{
  if (e.target !== preview) return; // only start marquee when clicking empty canvas
  if (e.button !== 0) return;
  const startX = e.clientX, startY = e.clientY;
  marquee = document.createElement('div');
  marquee.className = 'marquee';
  document.body.appendChild(marquee);
  const rectP = preview.getBoundingClientRect();
  function mmove(ev){
    const x = Math.min(startX, ev.clientX), y = Math.min(startY, ev.clientY);
    const w = Math.abs(ev.clientX - startX), h = Math.abs(ev.clientY - startY);
    marquee.style.left = x + 'px';
    marquee.style.top = y + 'px';
    marquee.style.width = w + 'px';
    marquee.style.height = h + 'px';
  }
  function mup(ev){
    document.removeEventListener('mousemove', mmove);
    document.removeEventListener('mouseup', mup);
    // compute intersection with preview children
    const mRect = marquee.getBoundingClientRect();
    clearSelection();
    for (const el of preview.querySelectorAll('.widget')){
      const r = el.getBoundingClientRect();
      if (rectsIntersect(mRect, r)) {
        addToSelection(el);
      }
    }
    marquee.remove();
    marquee = null;
    updateCode();
  }
  document.addEventListener('mousemove', mmove);
  document.addEventListener('mouseup', mup);
});

/* ----------------------------
   Utility functions
   ---------------------------- */
function rectsIntersect(a,b){
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function rgbToHex(rgb){
  if (!rgb) return '';
  if (rgb.startsWith('#')) return rgb;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '';
  return '#' + [1,2,3].map(i=>parseInt(m[i]).toString(16).padStart(2,'0')).join('');
}

/* ----------------------------
   Property editing
   ---------------------------- */
document.getElementById('apply-props').addEventListener('click', ()=>{
  if (selected.size === 0) return;
  if (selected.size > 1) {
    // apply uniform position/size if provided
    const x = props.inputs.x.value, y = props.inputs.y.value, w = props.inputs.width.value, h = props.inputs.height.value;
    for (let el of selected) {
      if (x !== '') el.style.left = x + 'px';
      if (y !== '') el.style.top = y + 'px';
      if (w !== '') el.style.width = w + 'px';
      if (h !== '') el.style.height = h + 'px';
    }
    updateCode();
    return;
  }
  const el = [...selected][0];
  const t = el.dataset.type;
  // common props
  const text = props.inputs.text.value;
  setTextContent(el, text);
  el.style.left = (props.inputs.x.value || 0) + 'px';
  el.style.top = (props.inputs.y.value || 0) + 'px';
  el.style.width = (props.inputs.width.value || 50) + 'px';
  el.style.height = (props.inputs.height.value || 20) + 'px';
  const ff = props.inputs.fontFamily.value; const fs = props.inputs.fontSize.value;
  if (ff) el.style.fontFamily = ff;
  if (fs) el.style.fontSize = fs + 'px';
  el.style.fontWeight = props.inputs.fontBold.checked ? '700' : '400';
  el.style.fontStyle = props.inputs.fontItalic.checked ? 'italic' : 'normal';
  el.style.backgroundColor = props.inputs.bg.value;
  el.style.color = props.inputs.fg.value;
  try {
    el._advanced = JSON.parse(props.inputs.advanced.value || '{}');
  } catch(e){ alert('Invalid advanced JSON'); }
  // special per-widget apply
  applySpecialProps(el);
  updateCode();
});

function setTextContent(el, text){
  if (el.querySelector('button')) el.querySelector('button').innerText = text;
  else if (el.querySelector('input[type=text]')) el.querySelector('input[type=text]').value = text;
  else if (el.querySelector('textarea')) el.querySelector('textarea').value = text;
  else el.childNodes.forEach(n => { if (n.nodeType===3) n.textContent = text; });
}

function buildSpecialProps(el){
  props.special.innerHTML = '';
  const type = el.dataset.type;
  if (type === 'listbox') {
    const label = document.createElement('label'); label.innerText = 'List items (one per line)';
    const ta = document.createElement('textarea'); ta.rows=6;
    // populate from DOM
    const select = el.querySelector('select');
    ta.value = Array.from(select.options).map(o=>o.text).join('\n');
    props.special.appendChild(label); props.special.appendChild(ta);
    // attach on apply
    props.special._apply = ()=>{
      select.innerHTML = '';
      ta.value.split('\n').forEach(v=>{
        if (v.trim()==='') return;
        const opt = document.createElement('option'); opt.text = v; select.appendChild(opt);
      });
    };
  } else if (type === 'combobox') {
    const label = document.createElement('label'); label.innerText = 'Combobox items (one per line)';
    const ta = document.createElement('textarea'); ta.rows=4;
    const select = el.querySelector('select');
    ta.value = Array.from(select.options).map(o=>o.text).join('\n');
    props.special.appendChild(label); props.special.appendChild(ta);
    props.special._apply = ()=>{
      select.innerHTML = '';
      ta.value.split('\n').forEach(v=>{
        if (!v) return;
        const opt = document.createElement('option'); opt.text = v; select.appendChild(opt);
      });
    };
  } else if (type === 'treeview') {
    const label = document.createElement('label'); label.innerText = 'Tree items (CSV: id,parent,text) one per line';
    const ta = document.createElement('textarea'); ta.rows=6;
    ta.value = (el._treeItems || []).map(r=>[r.id,r.parent,r.text].join(',')).join('\n');
    props.special.appendChild(label); props.special.appendChild(ta);
    props.special._apply = ()=>{
      const lines = ta.value.split('\n').map(l=>l.trim()).filter(Boolean);
      el._treeItems = lines.map(l=>{
        const parts = l.split(',').map(p=>p.trim());
        return {id:parts[0]||Math.random().toString(36).slice(2), parent:parts[1] || '', text:parts[2]||parts[0]};
      });
    };
  } else if (type === 'scale') {
    const min = labeledInput('Min', 'number', 0);
    const max = labeledInput('Max', 'number', 100);
    const val = labeledInput('Value', 'number', 50);
    // pull values
    const input = el;
    min.input.value = input.min || 0;
    max.input.value = input.max || 100;
    val.input.value = input.value || 50;
    props.special.appendChild(min.container); props.special.appendChild(max.container); props.special.appendChild(val.container);
    props.special._apply = ()=>{
      input.min = min.input.value; input.max = max.input.value; input.value = val.input.value;
    };
  } else if (type === 'spinbox') {
    const min = labeledInput('Min', 'number', 0);
    const max = labeledInput('Max', 'number', 10);
    const val = labeledInput('Value', 'number', 0);
    const input = el.querySelector('input[type=number]') || el;
    min.input.value = input.min || 0;
    max.input.value = input.max || 10;
    val.input.value = input.value || 0;
    props.special.appendChild(min.container); props.special.appendChild(max.container); props.special.appendChild(val.container);
    props.special._apply = ()=>{
      input.min = min.input.value; input.max = max.input.value; input.value = val.input.value;
    };
  } else {
    // default: nothing
  }
}

function applySpecialProps(el){
  if (props.special._apply) props.special._apply();
}

function labeledInput(labelText, type='text', defaultValue=''){
  const container = document.createElement('div');
  container.className = 'prop-row';
  const label = document.createElement('label'); label.innerText = labelText;
  const input = document.createElement('input'); input.type = type; input.value = defaultValue;
  container.appendChild(label); container.appendChild(input);
  return {container, input};
}

/* ----------------------------
   Duplicate, delete, z-order
   ---------------------------- */
document.getElementById('duplicate').addEventListener('click', ()=>{
  if (selected.size === 0) return;
  const todup = [...selected];
  clearSelection();
  for (const el of todup){
    const clone = el.cloneNode(true);
    const id = uid(); clone.dataset.id = id;
    clone.style.left = (parseFloat(clone.style.left||0) + 10) + 'px';
    clone.style.top = (parseFloat(clone.style.top||0) + 10) + 'px';
    preview.appendChild(clone);
    widgets.push({id, el:clone, type:clone.dataset.type, props:{}});
    makeWidgetInteractive(clone);
    addToSelection(clone);
  }
  updateCode();
});

document.getElementById('btn-delete').addEventListener('click', ()=>{
  if (selected.size === 0) return;
  for (const el of [...selected]) {
    widgets = widgets.filter(w=>w.el!==el);
    el.remove();
    selected.delete(el);
  }
  hideProps();
  updateCode();
});

document.getElementById('btn-bring-front').addEventListener('click', ()=>{
  if (selected.size === 0) return;
  for (const el of selected) {
    preview.appendChild(el); // moves to end -> front
  }
});

document.getElementById('btn-send-back').addEventListener('click', ()=>{
  if (selected.size === 0) return;
  for (const el of selected) {
    preview.insertBefore(el, preview.firstChild);
  }
});

/* ----------------------------
   Toggle code panel
   ---------------------------- */
toggleCodeBtn.addEventListener('click', ()=>{
  codePanel.classList.toggle('collapsed');
});

/* ----------------------------
   Show/hide grid
   ---------------------------- */
document.getElementById('showGrid').addEventListener('change', (e)=>{
  preview.classList.toggle('grid', e.target.checked);
});

/* ----------------------------
   Snap threshold input
   ---------------------------- */
snapInput.addEventListener('change', ()=>{ snapThreshold = parseInt(snapInput.value,10) || 8; });

/* ----------------------------
   Update generated code
   ---------------------------- */
function updateCode(){
  // rebuild widgets list from DOM
  widgets = Array.from(preview.querySelectorAll('.widget')).map(el => ({id: el.dataset.id, el, type: el.dataset.type, props: {}}));
  const w = preview.clientWidth, h = preview.clientHeight;
  const lines = [];
  lines.push('import tkinter as tk');
  lines.push('from tkinter import ttk');
  lines.push('');
  lines.push(`root = tk.Tk()`);
  lines.push(`root.geometry("${Math.round(w)}x${Math.round(h)}")`);
  lines.push('');
  // create widget variables
  widgets.forEach((wobj, i)=>{
    const el = wobj.el;
    wobj.props.text = extractText(el);
    const x = Math.round(parseFloat(el.style.left || 0));
    const y = Math.round(parseFloat(el.style.top || 0));
    const width = Math.round(el.offsetWidth);
    const height = Math.round(el.offsetHeight);
    const varn = `w_${i+1}_${wobj.id.replace(/[^a-z0-9]/ig,'')}`;
    wobj.varn = varn;
    // widget construction lines
    let ctor = '', cfg = '', place = ` ${varn}.place(x=${x}, y=${y}, width=${width}, height=${height})`;
    switch (wobj.type) {
      case 'frame': ctor = `${varn} = tk.Frame(root)`; break;
      case 'labelframe': ctor = `${varn} = tk.LabelFrame(root, text="${escapePy(wobj.props.text||'')}" )`; break;
      case 'label': ctor = `${varn} = tk.Label(root, text="${escapePy(wobj.props.text||'')}")`; break;
      case 'button': ctor = `${varn} = tk.Button(root, text="${escapePy(wobj.props.text||'')}")`; break;
      case 'checkbutton': ctor = `${varn}_var = tk.IntVar()\n${varn} = tk.Checkbutton(root, text="${escapePy(wobj.props.text||'')}", variable=${varn}_var)`; break;
      case 'radiobutton': ctor = `${varn}_var = tk.IntVar()\n${varn} = tk.Radiobutton(root, text="${escapePy(wobj.props.text||'')}", variable=${varn}_var, value=1)`; break;
      case 'entry': ctor = `${varn} = tk.Entry(root)`; if (wobj.props.text) ctor += `\n${varn}.insert(0, "${escapePy(wobj.props.text)}")`; break;
      case 'combobox': ctor = `${varn} = ttk.Combobox(root, values=${jsListFromSelect(wobj.el.querySelector('select'))})`; break;
      case 'listbox': ctor = `${varn} = tk.Listbox(root)` + `\n${jsListInsert(wobj.el.querySelector('select'), varname=varn)}`; break;
      case 'scrollbar': ctor = `${varn} = tk.Scrollbar(root)`; break;
      case 'text': ctor = `${varn} = tk.Text(root)` + (wobj.props.text? `\n${varn}.insert('1.0', """${escapePy(wobj.props.text)}""")` : ''); break;
      case 'scale': ctor = `${varn} = tk.Scale(root, from_=${wobj.el.min || 0}, to=${wobj.el.max || 100}, orient='horizontal')`; break;
      case 'spinbox': ctor = `${varn} = tk.Spinbox(root, from_=${wobj.el.min || 0}, to=${wobj.el.max || 10})`; break;
      case 'progressbar': ctor = `${varn} = ttk.Progressbar(root, orient='horizontal', mode='determinate', value=50)`; break;
      case 'separator': ctor = `${varn} = ttk.Separator(root, orient='horizontal')`; break;
      case 'panedwindow': ctor = `${varn} = tk.PanedWindow(root)`; break;
      case 'notebook': ctor = `${varn} = ttk.Notebook(root)`; break;
      case 'treeview': ctor = `${varn} = ttk.Treeview(root)` + (wobj.el._treeItems ? `\n${jsTreeInsert(wobj.el._treeItems, varn)}` : ''); break;
      default: ctor = `${varn} = tk.Frame(root)`; break;
    }
    lines.push(ctor);
    lines.push(place);
    lines.push('');
  });

  lines.push('');
  lines.push('root.mainloop()');
  generatedCode.value = lines.join('\n');
}

/* Utility helpers for code generation */
function escapePy(str){
  if (!str) return '';
  return str.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n');
}
function jsListFromSelect(select){
  if (!select) return '[]';
  const arr = Array.from(select.options).map(o=> `"${escapePy(o.text)}"`);
  return `[${arr.join(', ')}]`;
}
function jsListInsert(select, varname){
  if (!select) return '';
  const arr = Array.from(select.options).map(o=> `"${escapePy(o.text)}"`);
  if (arr.length === 0) return '';
  return `\n${varname}.insert(0, ${arr.join(', ')})`;
}
function jsTreeInsert(items, varname){
  // items: [{id,parent,text}]
  if (!items || items.length === 0) return '';
  return items.map(it=>`${varname}.insert(${it.parent?`'${it.parent}'`:'""'}, 'end', iid='${it.id}', text='${escapePy(it.text)}')`).join('\n');
}

/* ----------------------------
   Init: make existing preview area accept resize handles (window preview)
   ---------------------------- */
(function initPreviewResizer(){
  interact('#preview-resizer').resizable({
    edges: { left:true, right:true, bottom:true, top:true },
    modifiers: [ interact.modifiers.restrictSize({ min:{width:200, height:160} }) ],
    listeners: {
      move (event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.deltaRect.left;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.deltaRect.top;
        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x); target.setAttribute('data-y', y);
      },
      end (event) {
        // apply transform to become static
        const t = event.target;
        const x = parseFloat(t.getAttribute('data-x')) || 0;
        const y = parseFloat(t.getAttribute('data-y')) || 0;
        if (x || y) {
          t.style.transform = 'none';
          t.style.left = (parseFloat(t.style.left||0) + x) + 'px';
          t.style.top = (parseFloat(t.style.top||0) + y) + 'px';
          t.setAttribute('data-x','0'); t.setAttribute('data-y','0');
        }
        // preview element size may need to be constrained; set preview inner size to the shell minus header/padding
        // keep preview within shell
        const inner = t.querySelector('#preview') || preview;
        // compute available inner area (subtract header)
        const headerH = t.querySelector('#preview-header').offsetHeight;
        inner.style.width = Math.max(100, t.clientWidth - 12) + 'px';
        inner.style.height = Math.max(100, t.clientHeight - headerH - 12) + 'px';
        updateCode();
      }
    }
  });
})();

/* ----------------------------
   Track ctrl key state
   ---------------------------- */
document.addEventListener('keydown', e => { if (e.key === 'Control') isCtrl = true; });
document.addEventListener('keyup', e => { if (e.key === 'Control') isCtrl = false; });

/* ----------------------------
   Initial update
   ---------------------------- */
updateCode();
